// API: 사용자별 할당된 AI 봇 조회
// GET /api/user/ai-bots?academyId=xxx

interface Env {
  DB: D1Database;
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

    // URL에서 academyId 가져오기
    const url = new URL(context.request.url);
    const academyId = url.searchParams.get("academyId");

    if (!academyId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "academyId가 필요합니다",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🔍 사용자 봇 조회 - academyId: ${academyId}`);

    // bot_assignments 테이블 생성 (없으면)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS bot_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        academyId TEXT NOT NULL,
        botId TEXT NOT NULL,
        assignedBy TEXT,
        assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME,
        isActive INTEGER DEFAULT 1,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 할당된 봇 조회 (활성 + 만료되지 않음)
    console.log(`🔍 봇 할당 조회 시작: academyId=${academyId}`);
    
    const result = await db.prepare(`
      SELECT 
        b.id,
        b.name,
        b.description,
        b.systemPrompt,
        b.welcomeMessage,
        b.starterMessage1,
        b.starterMessage2,
        b.starterMessage3,
        b.profileIcon,
        b.profileImage,
        b.model,
        b.temperature,
        b.maxTokens,
        b.topK,
        b.topP,
        b.language,
        b.isActive,
        ba.expiresAt
      FROM bot_assignments ba
      JOIN ai_bots b ON ba.botId = b.id
      WHERE ba.academyId = ?
        AND ba.isActive = 1
        AND b.isActive = 1
        AND (ba.expiresAt IS NULL OR datetime(ba.expiresAt) > datetime('now'))
      ORDER BY ba.createdAt DESC
    `).bind(academyId).all();

    console.log(`📊 봇 할당 조회 결과:`, {
      success: result.success,
      count: result.results?.length,
      meta: result.meta
    });

    const bots = result.results || [];
    
    console.log(`✅ 할당된 봇 ${bots.length}개 찾음`);

    return new Response(
      JSON.stringify({
        success: true,
        bots: bots,
        count: bots.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("사용자 봇 조회 오류:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "봇 조회 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
