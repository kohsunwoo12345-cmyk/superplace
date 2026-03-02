// API: 사용자 구독 관리
// GET /api/subscriptions/status - 현재 사용자의 구독 상태 조회
// POST /api/subscriptions/check-limit - 특정 기능 사용 가능 여부 체크
// POST /api/subscriptions/track-usage - 사용량 기록

interface Env {
  DB: D1Database;
}

// 구독 상태 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // URL에서 userId 파라미터 가져오기
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "사용자 ID가 필요합니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // user_subscriptions 테이블 생성
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        planId TEXT NOT NULL,
        planName TEXT NOT NULL,
        period TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        
        startDate DATETIME,
        endDate DATETIME,
        
        usage_students INTEGER DEFAULT 0,
        usage_teachers INTEGER DEFAULT 0,
        usage_homeworkChecks INTEGER DEFAULT 0,
        usage_aiAnalysis INTEGER DEFAULT 0,
        usage_aiGrading INTEGER DEFAULT 0,
        usage_capabilityAnalysis INTEGER DEFAULT 0,
        usage_conceptAnalysis INTEGER DEFAULT 0,
        usage_similarProblems INTEGER DEFAULT 0,
        usage_landingPages INTEGER DEFAULT 0,
        
        limit_maxStudents INTEGER DEFAULT -1,
        limit_maxTeachers INTEGER DEFAULT -1,
        limit_maxHomeworkChecks INTEGER DEFAULT -1,
        limit_maxAIAnalysis INTEGER DEFAULT -1,
        limit_maxAIGrading INTEGER DEFAULT -1,
        limit_maxCapabilityAnalysis INTEGER DEFAULT -1,
        limit_maxConceptAnalysis INTEGER DEFAULT -1,
        limit_maxSimilarProblems INTEGER DEFAULT -1,
        limit_maxLandingPages INTEGER DEFAULT -1,
        
        lastPaymentAmount INTEGER DEFAULT 0,
        lastPaymentDate DATETIME,
        autoRenew INTEGER DEFAULT 0,
        
        lastResetDate DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 사용자의 활성 구독 조회
    const subscription = await db
      .prepare(`
        SELECT * FROM user_subscriptions 
        WHERE userId = ? AND status = 'active'
        ORDER BY createdAt DESC
        LIMIT 1
      `)
      .bind(userId)
      .first();

    if (!subscription) {
      // 구독이 없으면 무료 플랜 (모든 기능 차단)
      return new Response(
        JSON.stringify({
          success: true,
          hasSubscription: false,
          subscription: null,
          message: "활성 구독이 없습니다. 요금제를 선택해주세요.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 만료 여부 체크
    const now = new Date();
    const endDate = new Date(subscription.endDate as string);
    const isExpired = now > endDate;

    if (isExpired && subscription.status === 'active') {
      // 만료되었으면 상태 업데이트
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
          success: true,
          hasSubscription: false,
          subscription: null,
          message: "구독이 만료되었습니다. 갱신이 필요합니다.",
          expired: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 현재 사용량과 한도 반환
    const response = {
      success: true,
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        userId: subscription.userId,
        planId: subscription.planId,
        planName: subscription.planName,
        period: subscription.period,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        currentUsage: {
          students: subscription.usage_students,
          teachers: subscription.usage_teachers,
          homeworkChecks: subscription.usage_homeworkChecks,
          aiAnalysis: subscription.usage_aiAnalysis,
          aiGrading: subscription.usage_aiGrading,
          capabilityAnalysis: subscription.usage_capabilityAnalysis,
          conceptAnalysis: subscription.usage_conceptAnalysis,
          similarProblems: subscription.usage_similarProblems,
          landingPages: subscription.usage_landingPages,
        },
        limits: {
          maxStudents: subscription.limit_maxStudents,
          maxTeachers: subscription.limit_maxTeachers,
          maxHomeworkChecks: subscription.limit_maxHomeworkChecks,
          maxAIAnalysis: subscription.limit_maxAIAnalysis,
          maxAIGrading: subscription.limit_maxAIGrading,
          maxCapabilityAnalysis: subscription.limit_maxCapabilityAnalysis,
          maxConceptAnalysis: subscription.limit_maxConceptAnalysis,
          maxSimilarProblems: subscription.limit_maxSimilarProblems,
          maxLandingPages: subscription.limit_maxLandingPages,
        },
        daysLeft: Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      },
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("구독 상태 조회 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "구독 상태 조회 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
