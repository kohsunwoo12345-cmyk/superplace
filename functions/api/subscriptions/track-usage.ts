// API: 사용량 추적 및 업데이트
// POST /api/subscriptions/track-usage

interface Env {
  DB: D1Database;
}

interface TrackUsageRequest {
  userId: string;
  featureType: 'student_add' | 'teacher_add' | 'homework_check' | 'ai_analysis' | 'ai_grading' | 'capability_analysis' | 'concept_analysis' | 'similar_problem' | 'landing_page';
  action: 'create' | 'delete' | 'use';
  metadata?: any;
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

    const data: TrackUsageRequest = await context.request.json();
    
    if (!data.userId || !data.featureType || !data.action) {
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

    // usage_logs 테이블 생성
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        subscriptionId TEXT,
        featureType TEXT NOT NULL,
        action TEXT NOT NULL,
        metadata TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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
      .bind(data.userId)
      .first();

    if (!subscription) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "활성 구독이 없습니다",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 기능별 사용량 업데이트
    let usageField = '';
    let increment = 0;

    switch (data.featureType) {
      case 'student_add':
        usageField = 'usage_students';
        increment = data.action === 'create' ? 1 : (data.action === 'delete' ? -1 : 0);
        break;
      case 'teacher_add':
        usageField = 'usage_teachers';
        increment = data.action === 'create' ? 1 : (data.action === 'delete' ? -1 : 0);
        break;
      case 'homework_check':
        usageField = 'usage_homeworkChecks';
        increment = data.action === 'use' ? 1 : 0;
        break;
      case 'ai_analysis':
        usageField = 'usage_aiAnalysis';
        increment = data.action === 'use' ? 1 : 0;
        break;
      case 'ai_grading':
        usageField = 'usage_aiGrading';
        increment = data.action === 'use' ? 1 : 0;
        break;
      case 'capability_analysis':
        usageField = 'usage_capabilityAnalysis';
        increment = data.action === 'use' ? 1 : 0;
        break;
      case 'concept_analysis':
        usageField = 'usage_conceptAnalysis';
        increment = data.action === 'use' ? 1 : 0;
        break;
      case 'similar_problem':
        usageField = 'usage_similarProblems';
        increment = data.action === 'use' ? 1 : 0;
        break;
      case 'landing_page':
        usageField = 'usage_landingPages';
        increment = data.action === 'create' ? 1 : (data.action === 'delete' ? -1 : 0);
        break;
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

    // 사용량 업데이트
    if (increment !== 0) {
      await db
        .prepare(`
          UPDATE user_subscriptions 
          SET ${usageField} = MAX(0, ${usageField} + ?),
              updatedAt = datetime('now')
          WHERE id = ?
        `)
        .bind(increment, subscription.id)
        .run();
    }

    // 사용 로그 기록
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db
      .prepare(`
        INSERT INTO usage_logs (id, userId, subscriptionId, featureType, action, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        logId,
        data.userId,
        subscription.id,
        data.featureType,
        data.action,
        data.metadata ? JSON.stringify(data.metadata) : null
      )
      .run();

    // 업데이트된 사용량 조회
    const updated = await db
      .prepare(`
        SELECT ${usageField} as currentUsage FROM user_subscriptions WHERE id = ?
      `)
      .bind(subscription.id)
      .first();

    return new Response(
      JSON.stringify({
        success: true,
        message: "사용량이 기록되었습니다",
        currentUsage: updated?.currentUsage || 0,
        logId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("사용량 추적 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "사용량 추적 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
