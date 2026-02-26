interface Env {
  DB: D1Database;
}

interface PricingPlan {
  id?: number;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStudents: number;
  maxTeachers: number;
  features: string;
  isPopular: number;
  isActive: number;
  htmlContent?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    // 특정 요금제 조회 - 새 구독 시스템 사용
    if (id) {
      const plan = await DB.prepare(`
        SELECT 
          id,
          name,
          description,
          price_1month as monthlyPrice,
          price_12months as yearlyPrice,
          max_students as maxStudents,
          max_homework_checks as maxHomeworkChecks,
          max_ai_analysis as maxAIAnalysis,
          max_similar_problems as maxSimilarProblems,
          max_landing_pages as maxLandingPages,
          isActive,
          createdAt,
          updatedAt
        FROM pricing_plans 
        WHERE id = ?
      `).bind(id).first();

      if (!plan) {
        return new Response(JSON.stringify({
          success: false,
          error: "Pricing plan not found"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 기능 목록 생성
      const features = [];
      if (plan.maxStudents === -1) {
        features.push('무제한 학생 등록');
      } else {
        features.push(`최대 ${plan.maxStudents}명의 학생 관리`);
      }
      
      if (plan.maxHomeworkChecks === -1) {
        features.push('무제한 숙제 검사');
      } else {
        features.push(`월 ${plan.maxHomeworkChecks}회 숙제 검사`);
      }
      
      if (plan.maxAIAnalysis === -1) {
        features.push('무제한 AI 역량 분석');
      } else {
        features.push(`월 ${plan.maxAIAnalysis}회 AI 역량 분석`);
      }
      
      if (plan.maxSimilarProblems === -1) {
        features.push('무제한 유사문제 출제');
      } else {
        features.push(`월 ${plan.maxSimilarProblems}회 유사문제 출제`);
      }
      
      if (plan.maxLandingPages === -1) {
        features.push('무제한 랜딩페이지 제작');
      } else {
        features.push(`최대 ${plan.maxLandingPages}개 랜딩페이지`);
      }

      return new Response(JSON.stringify({
        success: true,
        plan: {
          ...plan,
          features: features,
          maxTeachers: 10
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 모든 요금제 조회 - 새 구독 시스템 테이블 사용
    const plansResult = await DB.prepare(`
      SELECT 
        id,
        name,
        description,
        price_1month as monthlyPrice,
        price_6months as price6months,
        price_12months as price12months,
        max_students as maxStudents,
        max_homework_checks as maxHomeworkChecks,
        max_ai_analysis as maxAIAnalysis,
        max_similar_problems as maxSimilarProblems,
        max_landing_pages as maxLandingPages,
        isActive,
        createdAt,
        updatedAt
      FROM pricing_plans 
      WHERE isActive = 1
      ORDER BY price_1month ASC
    `).all();

    const plans = (plansResult.results || []).map((plan: any) => {
      // 기능 목록을 동적으로 생성
      const features = [];
      
      if (plan.maxStudents === -1) {
        features.push('무제한 학생 등록');
      } else {
        features.push(`최대 ${plan.maxStudents}명의 학생 관리`);
      }
      
      if (plan.maxHomeworkChecks === -1) {
        features.push('무제한 숙제 검사');
      } else {
        features.push(`월 ${plan.maxHomeworkChecks}회 숙제 검사`);
      }
      
      if (plan.maxAIAnalysis === -1) {
        features.push('무제한 AI 역량 분석');
      } else {
        features.push(`월 ${plan.maxAIAnalysis}회 AI 역량 분석`);
      }
      
      if (plan.maxSimilarProblems === -1) {
        features.push('무제한 유사문제 출제');
      } else {
        features.push(`월 ${plan.maxSimilarProblems}회 유사문제 출제`);
      }
      
      if (plan.maxLandingPages === -1) {
        features.push('무제한 랜딩페이지 제작');
      } else {
        features.push(`최대 ${plan.maxLandingPages}개 랜딩페이지`);
      }

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        monthlyPrice: plan.monthlyPrice || 0,
        yearlyPrice: plan.price12month || 0,
        maxStudents: plan.maxStudents,
        maxTeachers: 10, // 기본값
        features: features,
        isPopular: plan.name === 'Pro' ? 1 : 0,
        isActive: plan.isActive,
        htmlContent: '',
        // 추가 정보
        maxHomeworkChecks: plan.maxHomeworkChecks,
        maxAIAnalysis: plan.maxAIAnalysis,
        maxSimilarProblems: plan.maxSimilarProblems,
        maxLandingPages: plan.maxLandingPages,
      };
    });

    // 각 요금제별 구독 중인 학원 수 조회 - user_subscriptions 테이블 사용
    const statsPromises = plans.map(async (plan: any) => {
      const result = await DB.prepare(`
        SELECT COUNT(DISTINCT academyId) as count
        FROM user_subscriptions
        WHERE planId = ? AND isActive = 1
      `).bind(plan.id).first();

      return {
        planId: plan.id,
        planName: plan.name,
        activeAcademies: result?.count || 0
      };
    });

    const stats = await Promise.all(statsPromises);

    return new Response(JSON.stringify({
      success: true,
      plans,
      stats
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Pricing API error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to fetch pricing plans",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// 요금제 생성 - 새 구독 시스템으로 이동
// 이제 /api/admin/pricing-plans POST를 사용하세요
export const onRequestPost: PagesFunction<Env> = async (context) => {
  return new Response(JSON.stringify({
    success: false,
    error: "This endpoint is deprecated",
    message: "Please use /api/admin/pricing-plans POST instead",
    newEndpoint: "/api/admin/pricing-plans"
  }), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  });
};

// 요금제 수정 - 새 구독 시스템으로 이동
// 이제 /api/admin/pricing-plans PUT을 사용하세요
export const onRequestPut: PagesFunction<Env> = async (context) => {
  return new Response(JSON.stringify({
    success: false,
    error: "This endpoint is deprecated",
    message: "Please use /api/admin/pricing-plans PUT instead",
    newEndpoint: "/api/admin/pricing-plans"
  }), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  });
};

// 요금제 삭제 - 새 구독 시스템으로 이동
// 이제 /api/admin/pricing-plans DELETE를 사용하세요
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  return new Response(JSON.stringify({
    success: false,
    error: "This endpoint is deprecated",
    message: "Please use /api/admin/pricing-plans DELETE instead",
    newEndpoint: "/api/admin/pricing-plans"
  }), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  });
};
