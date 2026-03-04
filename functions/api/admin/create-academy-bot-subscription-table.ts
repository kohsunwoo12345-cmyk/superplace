// AcademyBotSubscription 테이블 생성 API
// 학원에 AI 봇을 할당할 때 사용하는 테이블

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log("🔧 AcademyBotSubscription 테이블 생성 시작...");
    
    // AcademyBotSubscription 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS AcademyBotSubscription (
        id TEXT PRIMARY KEY,
        academyId TEXT NOT NULL,
        productId TEXT NOT NULL,
        productName TEXT NOT NULL,
        totalStudentSlots INTEGER NOT NULL DEFAULT 0,
        usedStudentSlots INTEGER NOT NULL DEFAULT 0,
        remainingStudentSlots INTEGER NOT NULL DEFAULT 0,
        subscriptionStart TEXT NOT NULL,
        subscriptionEnd TEXT NOT NULL,
        pricePerStudent REAL DEFAULT 0,
        memo TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (academyId) REFERENCES academy(id),
        FOREIGN KEY (productId) REFERENCES ai_bots(id)
      )
    `).run();
    
    console.log("✅ AcademyBotSubscription 테이블 생성 완료");
    
    // 인덱스 생성
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_academy 
      ON AcademyBotSubscription(academyId)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_product 
      ON AcademyBotSubscription(productId)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_active 
      ON AcademyBotSubscription(isActive)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_end 
      ON AcademyBotSubscription(subscriptionEnd)
    `).run();
    
    console.log("✅ 인덱스 생성 완료");
    
    // 테이블 존재 확인
    const tableCheck = await DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='AcademyBotSubscription'
    `).first();
    
    // 테이블 스키마 조회
    const schema = await DB.prepare(`
      PRAGMA table_info(AcademyBotSubscription)
    `).all();
    
    console.log("📊 테이블 스키마:", schema.results);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "AcademyBotSubscription 테이블 생성 완료",
        tableExists: !!tableCheck,
        schema: schema.results || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
    
  } catch (error: any) {
    console.error("❌ 테이블 생성 실패:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "테이블 생성 실패",
        details: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
