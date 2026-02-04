interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const userId = context.params.id as string;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 봇 할당 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_bot_assignments (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        botId TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (botId) REFERENCES ai_bots(id)
      )
    `).run();

    // 봇 할당 정보 조회 (봇 이름 포함)
    const assignmentsResult = await DB.prepare(
      `SELECT 
        a.id, a.userId, a.botId, a.startDate, a.endDate, a.isActive,
        b.name as botName
       FROM user_bot_assignments a
       LEFT JOIN ai_bots b ON a.botId = b.id
       WHERE a.userId = ?
       ORDER BY datetime(a.createdAt) DESC`
    ).bind(userId).all();

    const assignments = assignmentsResult?.results || [];

    // 만료된 할당 자동 비활성화
    const now = new Date().toISOString().split('T')[0];
    for (const assignment of assignments as any[]) {
      if (assignment.isActive && assignment.endDate < now) {
        await DB.prepare(`
          UPDATE user_bot_assignments 
          SET isActive = 0 
          WHERE id = ?
        `).bind(assignment.id).run();
        assignment.isActive = 0;
      }
    }

    return new Response(JSON.stringify({ assignments }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Bot assignments error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch bot assignments",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
