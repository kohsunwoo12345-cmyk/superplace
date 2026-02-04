interface Env {
  DB: D1Database;
}

// AI 대화 기록 조회
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const { id } = context.params as { id: string };

    if (!DB) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // AI 대화 기록 테이블 생성 (없을 경우)
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS ai_chat_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        botId TEXT,
        botName TEXT,
        message TEXT NOT NULL,
        response TEXT,
        model TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // 사용자의 AI 대화 기록 조회
    const result = await DB.prepare(
      `SELECT 
        id, 
        userId, 
        botId, 
        botName, 
        message, 
        response, 
        model, 
        createdAt
      FROM ai_chat_logs 
      WHERE userId = ?
      ORDER BY datetime(createdAt) DESC
      LIMIT 100`
    ).bind(id).all();

    const chatLogs = result?.results || [];

    return new Response(
      JSON.stringify({ 
        chatLogs,
        total: chatLogs.length 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("AI chat logs error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch AI chat logs",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
