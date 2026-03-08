// Create point_transactions table
// GET /api/migrations/create-point-transactions-table

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    console.log("🔧 Creating point_transactions table...");

    // 테이블 생성
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS point_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES User(id)
      )
    `).run();

    console.log("✅ point_transactions table created");

    // 인덱스 생성
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_point_transactions_userId ON point_transactions(userId)
    `).run();

    console.log("✅ Index created");

    // 테스트 데이터 추가 (사용자 ID 208에게 10,000P)
    await env.DB.prepare(`
      INSERT INTO point_transactions (userId, amount, type, description, createdAt)
      VALUES (?, ?, ?, ?, datetime('now'))
    `)
      .bind(208, 10000, 'CHARGE', '초기 테스트 포인트')
      .run();

    console.log("✅ Test data added (10,000P for user 208)");

    return new Response(
      JSON.stringify({
        success: true,
        message: "point_transactions table created successfully",
        testData: {
          userId: 208,
          amount: 10000,
          type: 'CHARGE',
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Migration failed:", error);
    return new Response(
      JSON.stringify({
        error: "Migration failed",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
