// Create point_transactions table
// GET /api/migrations/create-point-transactions-table

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    console.log("🔧 Creating point_transactions table...");

    // 기존 테이블 삭제 (이미 잘못된 스키마로 생성된 경우 대비)
    try {
      await env.DB.prepare(`DROP TABLE IF EXISTS point_transactions`).run();
      console.log("🗑️ Dropped existing point_transactions table");
    } catch (dropError) {
      console.log("ℹ️ No existing table to drop");
    }

    // 테이블 생성 (FOREIGN KEY 제거, email 필드 추가)
    await env.DB.prepare(`
      CREATE TABLE point_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        userEmail TEXT,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL
      )
    `).run();

    console.log("✅ point_transactions table created");

    // 인덱스 생성
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_point_transactions_userId ON point_transactions(userId)
    `).run();
    
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_point_transactions_userEmail ON point_transactions(userEmail)
    `).run();

    console.log("✅ Indexes created");

    // 테스트 데이터 추가 (사용자 이메일로 저장)
    await env.DB.prepare(`
      INSERT INTO point_transactions (userId, userEmail, amount, type, description, createdAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `)
      .bind(1, 'wangholy1@naver.com', 10000, 'CHARGE', '초기 테스트 포인트')
      .run();

    console.log("✅ Test data added (10,000P for user 208)");

    return new Response(
      JSON.stringify({
        success: true,
        message: "point_transactions table created successfully",
        testData: {
          userId: 1,
          userEmail: 'wangholy1@naver.com',
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
