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

    // 로그인 기록 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_login_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        ip TEXT NOT NULL,
        userAgent TEXT,
        success INTEGER DEFAULT 1,
        loginAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `).run();

    // 로그인 기록 조회
    const logsResult = await DB.prepare(
      `SELECT * FROM user_login_logs 
       WHERE userId = ? 
       ORDER BY datetime(loginAt) DESC 
       LIMIT 100`
    ).bind(userId).all();

    const logs = logsResult?.results || [];

    return new Response(JSON.stringify({ logs }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Login logs error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch login logs",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
