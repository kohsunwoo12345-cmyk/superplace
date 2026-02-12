interface Env {
  DB: D1Database;
}

/**
 * GET /api/admin/ai-bots/assignments
 * AI 봇 할당 목록 조회
 */
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(
      JSON.stringify({ success: false, error: "Database not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("📋 AI 봇 할당 목록 조회");

    // 테이블 존재 확인 및 생성
    try {
      await DB.prepare(`
        CREATE TABLE IF NOT EXISTS ai_bot_assignments (
          id TEXT PRIMARY KEY,
          botId TEXT NOT NULL,
          botName TEXT NOT NULL,
          userId INTEGER NOT NULL,
          userName TEXT NOT NULL,
          userEmail TEXT NOT NULL,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          duration INTEGER NOT NULL,
          durationUnit TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          createdAt TEXT DEFAULT (datetime('now'))
        )
      `).run();
    } catch (createError: any) {
      console.warn("⚠️ 테이블 생성 경고:", createError.message);
    }

    // 할당 목록 조회
    const result = await DB.prepare(`
      SELECT 
        id,
        botId,
        botName,
        userId,
        userName,
        userEmail,
        startDate,
        endDate,
        duration,
        durationUnit,
        status,
        createdAt
      FROM ai_bot_assignments
      ORDER BY createdAt DESC
      LIMIT 100
    `).all();

    const assignments = result.results || [];
    
    // 만료된 할당 상태 업데이트
    const now = new Date();
    const kstOffset = 9 * 60;
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
    const today = kstNow.toISOString().split('T')[0];

    for (const assignment of assignments as any[]) {
      if (assignment.status === 'active' && assignment.endDate < today) {
        await DB.prepare(`
          UPDATE ai_bot_assignments
          SET status = 'expired'
          WHERE id = ?
        `).bind(assignment.id).run();
        
        assignment.status = 'expired';
      }
    }

    console.log(`✅ ${assignments.length}개의 할당 조회 완료`);

    return new Response(
      JSON.stringify({
        success: true,
        assignments,
        count: assignments.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ 할당 목록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "할당 목록 조회 중 오류가 발생했습니다",
        assignments: [],
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * DELETE /api/admin/ai-bots/assignments/{assignmentId}
 * AI 봇 할당 취소
 */
export const onRequestDelete = async (context: { request: Request; env: Env; params: any }) => {
  const { request, env, params } = context;
  const { DB } = env;

  if (!DB) {
    return new Response(
      JSON.stringify({ success: false, error: "Database not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const assignmentId = params.assignmentId;

    if (!assignmentId) {
      return new Response(
        JSON.stringify({ success: false, error: "할당 ID가 필요합니다" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("❌ AI 봇 할당 취소:", assignmentId);

    // 할당 삭제
    await DB.prepare(`
      DELETE FROM ai_bot_assignments
      WHERE id = ?
    `).bind(assignmentId).run();

    console.log("✅ 할당 취소 완료");

    return new Response(
      JSON.stringify({
        success: true,
        message: "할당이 취소되었습니다",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ 할당 취소 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "할당 취소 중 오류가 발생했습니다",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
