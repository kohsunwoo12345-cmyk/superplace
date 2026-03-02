// API: 사용 가능 여부 체크 및 사용량 기록
// POST /api/subscriptions/check-limit - 기능 사용 가능 여부 확인
// POST /api/subscriptions/track-usage - 사용량 증가

interface Env {
  DB: D1Database;
}

interface CheckLimitRequest {
  userId: string;
  featureType: 'student_add' | 'teacher_add' | 'homework_check' | 'ai_analysis' | 'ai_grading' | 'capability_analysis' | 'concept_analysis' | 'similar_problem' | 'landing_page' | 'attendance_check';
  action?: 'create' | 'use';
}

interface TrackUsageRequest {
  userId: string;
  featureType: string;
  action: 'create' | 'delete' | 'use';
  metadata?: any;
}

// 사용 가능 여부 체크
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: CheckLimitRequest = await context.request.json();
    
    if (!data.userId || !data.featureType) {
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

    // 사용자의 활성 구독 조회
    const subscription = await db
      .prepare(`
        SELECT * FROM user_subscriptions 
        WHERE userId = ? AND status = 'active'
        ORDER BY createdAt DESC
        LIMIT 1
      `)
      .bind(data.userId)
      .first();

    // 구독이 없으면 모든 기능 차단
    if (!subscription) {
      return new Response(
        JSON.stringify({
          success: false,
          allowed: false,
          reason: "NO_SUBSCRIPTION",
          message: "활성 구독이 없습니다. 요금제를 선택해주세요.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 만료 여부 체크
    const now = new Date();
    const endDate = new Date(subscription.endDate as string);
    const isExpired = now > endDate;

    if (isExpired) {
      // 만료되었으면 모든 기능 차단 (출석 체크 포함)
      await db
        .prepare(`
          UPDATE user_subscriptions 
          SET status = 'expired', updatedAt = datetime('now')
          WHERE id = ?
        `)
        .bind(subscription.id)
        .run();

      return new Response(
        JSON.stringify({
          success: false,
          allowed: false,
          reason: "SUBSCRIPTION_EXPIRED",
          message: "구독이 만료되었습니다. 갱신이 필요합니다.",
          expiredDate: subscription.endDate,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 기능별 한도 체크
    let usageField = '';
    let limitField = '';
    let currentUsage = 0;
    let maxLimit = -1;

    switch (data.featureType) {
      case 'student_add':
        usageField = 'usage_students';
        limitField = 'limit_maxStudents';
        currentUsage = subscription.usage_students as number;
        maxLimit = subscription.limit_maxStudents as number;
        break;
      case 'teacher_add':
        usageField = 'usage_teachers';
        limitField = 'limit_maxTeachers';
        currentUsage = subscription.usage_teachers as number;
        maxLimit = subscription.limit_maxTeachers as number;
        break;
      case 'homework_check':
        usageField = 'usage_homeworkChecks';
        limitField = 'limit_maxHomeworkChecks';
        currentUsage = subscription.usage_homeworkChecks as number;
        maxLimit = subscription.limit_maxHomeworkChecks as number;
        break;
      case 'ai_analysis':
        usageField = 'usage_aiAnalysis';
        limitField = 'limit_maxAIAnalysis';
        currentUsage = subscription.usage_aiAnalysis as number;
        maxLimit = subscription.limit_maxAIAnalysis as number;
        break;
      case 'ai_grading':
        usageField = 'usage_aiGrading';
        limitField = 'limit_maxAIGrading';
        currentUsage = subscription.usage_aiGrading as number;
        maxLimit = subscription.limit_maxAIGrading as number;
        break;
      case 'capability_analysis':
        usageField = 'usage_capabilityAnalysis';
        limitField = 'limit_maxCapabilityAnalysis';
        currentUsage = subscription.usage_capabilityAnalysis as number;
        maxLimit = subscription.limit_maxCapabilityAnalysis as number;
        break;
      case 'concept_analysis':
        usageField = 'usage_conceptAnalysis';
        limitField = 'limit_maxConceptAnalysis';
        currentUsage = subscription.usage_conceptAnalysis as number;
        maxLimit = subscription.limit_maxConceptAnalysis as number;
        break;
      case 'similar_problem':
        usageField = 'usage_similarProblems';
        limitField = 'limit_maxSimilarProblems';
        currentUsage = subscription.usage_similarProblems as number;
        maxLimit = subscription.limit_maxSimilarProblems as number;
        break;
      case 'landing_page':
        usageField = 'usage_landingPages';
        limitField = 'limit_maxLandingPages';
        currentUsage = subscription.usage_landingPages as number;
        maxLimit = subscription.limit_maxLandingPages as number;
        break;
      case 'attendance_check':
        // 출석 체크는 구독만 있으면 OK (위에서 만료 체크 완료)
        return new Response(
          JSON.stringify({
            success: true,
            allowed: true,
            subscription: {
              planName: subscription.planName,
              endDate: subscription.endDate,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      default:
        return new Response(
          JSON.stringify({
            success: false,
            message: "알 수 없는 기능 타입입니다",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }

    // 무제한(-1)이면 허용
    if (maxLimit === -1) {
      return new Response(
        JSON.stringify({
          success: true,
          allowed: true,
          unlimited: true,
          currentUsage,
          maxLimit: '무제한',
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 한도 초과 체크
    if (currentUsage >= maxLimit) {
      return new Response(
        JSON.stringify({
          success: false,
          allowed: false,
          reason: "LIMIT_EXCEEDED",
          message: `${data.featureType} 사용 한도를 초과했습니다. (${currentUsage}/${maxLimit})`,
          currentUsage,
          maxLimit,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 사용 가능
    return new Response(
      JSON.stringify({
        success: true,
        allowed: true,
        currentUsage,
        maxLimit,
        remaining: maxLimit - currentUsage,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("사용 가능 여부 체크 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "사용 가능 여부 체크 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
