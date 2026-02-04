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

    // 활동 로그 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        ip TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `).run();

    // 활동 로그 조회
    const logsResult = await DB.prepare(
      `SELECT * FROM user_activity_logs 
       WHERE userId = ? 
       ORDER BY datetime(createdAt) DESC 
       LIMIT 500`
    ).bind(userId).all();

    const logs = logsResult?.results || [];

    return new Response(JSON.stringify({ logs }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Activity logs error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch activity logs",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
