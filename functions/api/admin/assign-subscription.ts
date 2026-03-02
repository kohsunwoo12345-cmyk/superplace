// API: 사용자 구독 할당 (관리자 전용)
// POST /api/admin/assign-subscription - 사용자에게 구독 할당

interface Env {
  DB: D1Database;
}

interface AssignSubscriptionRequest {
  userId: string;
  planId: string;
  period: '1month' | '6months' | '12months';
  startDate?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: AssignSubscriptionRequest = await context.request.json();
    
    if (!data.userId || !data.planId || !data.period) {
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

    // 요금제 정보 조회
    const plan = await db
      .prepare(`SELECT * FROM pricing_plans WHERE id = ?`)
      .bind(data.planId)
      .first();

    if (!plan) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "존재하지 않는 요금제입니다",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 시작일과 종료일 계산
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = new Date(startDate);

    switch (data.period) {
      case '1month':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '6months':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case '12months':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    // 기존 활성 구독 비활성화
    await db
      .prepare(`
        UPDATE user_subscriptions 
        SET status = 'cancelled', updatedAt = datetime('now')
        WHERE userId = ? AND status = 'active'
      `)
      .bind(data.userId)
      .run();

    // 새 구독 생성
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db
      .prepare(`
        INSERT INTO user_subscriptions (
          id, userId, planId, planName, period, status,
          startDate, endDate,
          limit_maxStudents, limit_maxTeachers, limit_maxHomeworkChecks,
          limit_maxAIAnalysis, limit_maxAIGrading, limit_maxCapabilityAnalysis,
          limit_maxConceptAnalysis, limit_maxSimilarProblems, limit_maxLandingPages,
          lastResetDate
        ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        subscriptionId,
        data.userId,
        plan.id,
        plan.name,
        data.period,
        startDate.toISOString(),
        endDate.toISOString(),
        plan.maxStudents,
        plan.maxTeachers,
        plan.maxHomeworkChecks,
        plan.maxAIAnalysis,
        plan.maxAIGrading,
        plan.maxCapabilityAnalysis,
        plan.maxConceptAnalysis,
        plan.maxSimilarProblems,
        plan.maxLandingPages,
        startDate.toISOString()
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "구독이 할당되었습니다",
        subscriptionId,
        subscription: {
          planName: plan.name,
          period: data.period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("구독 할당 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "구독 할당 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
