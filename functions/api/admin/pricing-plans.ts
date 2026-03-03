// API: 요금제 관리 (관리자 전용)
// GET /api/admin/pricing-plans - 요금제 목록 조회
// POST /api/admin/pricing-plans - 요금제 생성
// PUT /api/admin/pricing-plans/[id] - 요금제 수정
// DELETE /api/admin/pricing-plans/[id] - 요금제 삭제

interface Env {
  DB: D1Database;
}

interface PricingPlanRequest {
  name: string;
  description: string;
  pricing_1month: number;
  pricing_6months: number;
  pricing_12months: number;
  maxStudents: number;
  maxTeachers: number;
  maxHomeworkChecks: number;
  maxAIAnalysis: number;
  maxAIGrading: number;
  maxCapabilityAnalysis: number;
  maxConceptAnalysis: number;
  maxSimilarProblems: number;
  maxLandingPages: number;
  features: string; // JSON stringified array
  isPopular: boolean;
  color: string;
  order: number;
  isActive: boolean;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // pricing_plans 테이블 생성 (실제 DB 스키마에 맞춤)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        
        price_1month INTEGER DEFAULT 0,
        price_6months INTEGER DEFAULT 0,
        price_12months INTEGER DEFAULT 0,
        
        max_students INTEGER DEFAULT -1,
        max_homework_checks INTEGER DEFAULT -1,
        max_ai_analysis INTEGER DEFAULT -1,
        max_similar_problems INTEGER DEFAULT -1,
        max_landing_pages INTEGER DEFAULT -1,
        
        features TEXT,
        isPopular INTEGER DEFAULT 0,
        color TEXT DEFAULT '#3B82F6',
        \`order\` INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 요금제 목록 조회
    const result = await db.prepare(`
      SELECT * FROM pricing_plans ORDER BY \`order\` ASC, createdAt DESC
    `).all();

    const plans = (result.results || []).map((plan: any) => ({
      ...plan,
      pricing: {
        '1month': plan.price_1month ?? 0,
        '6months': plan.price_6months ?? 0,
        '12months': plan.price_12months ?? 0,
      },
      limits: {
        maxStudents: plan.max_students ?? -1,
        maxTeachers: -1, // DB에 컬럼 없음, 기본값 사용
        maxHomeworkChecks: plan.max_homework_checks ?? -1,
        maxAIAnalysis: plan.max_ai_analysis ?? -1,
        maxAIGrading: -1, // DB에 컬럼 없음, 기본값 사용
        maxCapabilityAnalysis: -1, // DB에 컬럼 없음, 기본값 사용
        maxConceptAnalysis: -1, // DB에 컬럼 없음, 기본값 사용
        maxSimilarProblems: plan.max_similar_problems ?? -1,
        maxLandingPages: plan.max_landing_pages ?? -1,
      },
      features: plan.features ? JSON.parse(plan.features) : [],
      isPopular: plan.isPopular === 1,
      isActive: plan.isActive === 1,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        plans,
        count: plans.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("요금제 목록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "요금제 목록 조회 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: PricingPlanRequest = await context.request.json();
    
    console.log("📥 POST /api/admin/pricing-plans - Request data:", data);
    
    if (!data.name || data.pricing_1month === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "필수 정보가 누락되었습니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const planId = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await db
      .prepare(`
        INSERT INTO pricing_plans (
          id, name, description,
          price_1month, price_6months, price_12months,
          max_students, max_homework_checks,
          max_ai_analysis, max_similar_problems, max_landing_pages,
          features, isPopular, color, \`order\`, isActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        planId,
        data.name,
        data.description || '',
        data.pricing_1month,
        data.pricing_6months,
        data.pricing_12months,
        data.maxStudents || -1,
        data.maxHomeworkChecks || -1,
        data.maxAIAnalysis || -1,
        data.maxSimilarProblems || -1,
        data.maxLandingPages || -1,
        data.features || '[]',
        data.isPopular ? 1 : 0,
        data.color || '#3B82F6',
        data.order || 0,
        data.isActive ? 1 : 0
      )
      .run();

    console.log("✅ 요금제 생성 성공:", planId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "요금제가 생성되었습니다",
        planId,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ 요금제 생성 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "요금제 생성 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: PricingPlanRequest & { id: string } = await context.request.json();
    
    console.log("📝 PUT /api/admin/pricing-plans - Request data:", data);
    
    if (!data.id || !data.name || data.pricing_1month === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "필수 정보가 누락되었습니다 (id, name, pricing_1month 필요)",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 요금제 존재 확인
    const existingPlan = await db
      .prepare("SELECT id FROM pricing_plans WHERE id = ?")
      .bind(data.id)
      .first();

    if (!existingPlan) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "요금제를 찾을 수 없습니다",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await db
      .prepare(`
        UPDATE pricing_plans SET
          name = ?,
          description = ?,
          price_1month = ?,
          price_6months = ?,
          price_12months = ?,
          max_students = ?,
          max_homework_checks = ?,
          max_ai_analysis = ?,
          max_similar_problems = ?,
          max_landing_pages = ?,
          features = ?,
          isPopular = ?,
          color = ?,
          \`order\` = ?,
          isActive = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        data.name,
        data.description || '',
        data.pricing_1month,
        data.pricing_6months,
        data.pricing_12months,
        data.maxStudents || -1,
        data.maxHomeworkChecks || -1,
        data.maxAIAnalysis || -1,
        data.maxSimilarProblems || -1,
        data.maxLandingPages || -1,
        data.features || '[]',
        data.isPopular ? 1 : 0,
        data.color || '#3B82F6',
        data.order || 0,
        data.isActive ? 1 : 0,
        data.id
      )
      .run();

    console.log("✅ 요금제 수정 성공:", data.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "요금제가 수정되었습니다",
        planId: data.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ 요금제 수정 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "요금제 수정 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const planId = url.searchParams.get("id");
    
    console.log("🗑️ DELETE /api/admin/pricing-plans - Plan ID:", planId);
    
    if (!planId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "요금제 ID가 필요합니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 요금제 존재 확인
    const existingPlan = await db
      .prepare("SELECT id FROM pricing_plans WHERE id = ?")
      .bind(planId)
      .first();

    if (!existingPlan) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "요금제를 찾을 수 없습니다",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 이 요금제를 사용 중인 구독이 있는지 확인
    const activeSubscriptions = await db
      .prepare("SELECT COUNT(*) as count FROM user_subscriptions WHERE planId = ? AND status = 'active'")
      .bind(planId)
      .first();

    if (activeSubscriptions && (activeSubscriptions as any).count > 0) {
      // 활성 구독이 있으면 비활성화만 수행
      await db
        .prepare("UPDATE pricing_plans SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(planId)
        .run();
      
      console.log("⚠️ 활성 구독 존재 - 요금제 비활성화:", planId);

      return new Response(
        JSON.stringify({
          success: true,
          message: "활성 구독이 있어 요금제를 비활성화했습니다",
          action: "deactivated",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 활성 구독이 없으면 완전 삭제
    await db
      .prepare("DELETE FROM pricing_plans WHERE id = ?")
      .bind(planId)
      .run();

    console.log("✅ 요금제 삭제 성공:", planId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "요금제가 삭제되었습니다",
        action: "deleted",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ 요금제 삭제 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "요금제 삭제 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
