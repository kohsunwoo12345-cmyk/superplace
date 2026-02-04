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

    // 결제 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_payments (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        productName TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'PENDING',
        paidAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `).run();

    // 결제 내역 조회
    const paymentsResult = await DB.prepare(
      `SELECT * FROM user_payments 
       WHERE userId = ? 
       ORDER BY datetime(paidAt) DESC`
    ).bind(userId).all();

    const payments = paymentsResult?.results || [];

    return new Response(JSON.stringify({ payments }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Payments error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch payments",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
