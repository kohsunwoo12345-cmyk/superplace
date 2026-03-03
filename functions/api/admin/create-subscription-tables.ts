// 누락된 subscription 관련 테이블 생성 API
// user_subscriptions, subscription_requests, usage_alerts 테이블 생성

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    console.log("🔧 누락된 subscription 테이블 생성 시작...");
    
    // 1️⃣ subscription_requests 테이블 생성
    console.log("1️⃣ subscription_requests 테이블 생성 중...");
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS subscription_requests (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        planId TEXT NOT NULL,
        planName TEXT NOT NULL,
        period TEXT NOT NULL,
        finalPrice INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        requestedAt TEXT DEFAULT (datetime('now')),
        processedAt TEXT,
        approvedBy TEXT,
        approvedByEmail TEXT,
        adminNote TEXT,
        companyName TEXT,
        businessNumber TEXT,
        requestNote TEXT,
        FOREIGN KEY (userId) REFERENCES User(id)
      )
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_subscription_requests_userId ON subscription_requests(userId)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON subscription_requests(status)
    `).run();
    
    console.log("✅ subscription_requests 테이블 생성 완료");
    
    // 2️⃣ user_subscriptions 테이블 생성
    console.log("2️⃣ user_subscriptions 테이블 생성 중...");
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        planId TEXT NOT NULL,
        planName TEXT NOT NULL,
        period TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        max_students INTEGER DEFAULT -1,
        max_homework_checks INTEGER DEFAULT -1,
        max_ai_analysis INTEGER DEFAULT -1,
        max_similar_problems INTEGER DEFAULT -1,
        max_landing_pages INTEGER DEFAULT -1,
        lastPaymentAmount INTEGER,
        lastPaymentDate TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES User(id)
      )
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_userId ON user_subscriptions(userId)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_endDate ON user_subscriptions(endDate)
    `).run();
    
    console.log("✅ user_subscriptions 테이블 생성 완료");
    
    // 3️⃣ usage_alerts 테이블 생성 (알림 기능용)
    console.log("3️⃣ usage_alerts 테이블 생성 중...");
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS usage_alerts (
        id TEXT PRIMARY KEY,
        academyId TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        threshold INTEGER,
        currentValue INTEGER,
        maxValue INTEGER,
        isRead INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT (datetime('now')),
        readAt TEXT
      )
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_alerts_academyId ON usage_alerts(academyId)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_alerts_isRead ON usage_alerts(isRead)
    `).run();
    
    console.log("✅ usage_alerts 테이블 생성 완료");
    
    // 4️⃣ usage_logs 테이블 생성 (사용량 추적용)
    console.log("4️⃣ usage_logs 테이블 생성 중...");
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL,
        details TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES User(id)
      )
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_logs_userId ON usage_logs(userId)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_logs_type ON usage_logs(type)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_logs_createdAt ON usage_logs(createdAt)
    `).run();
    
    console.log("✅ usage_logs 테이블 생성 완료");
    
    // 5️⃣ 테이블 존재 확인
    const tables = await DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name IN ('subscription_requests', 'user_subscriptions', 'usage_alerts', 'usage_logs')
      ORDER BY name
    `).all();
    
    console.log("📊 생성된 테이블 목록:", tables.results?.map(t => t.name));
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "모든 subscription 관련 테이블 생성 완료",
        tables: tables.results?.map(t => t.name) || [],
        created: {
          subscription_requests: true,
          user_subscriptions: true,
          usage_alerts: true,
          usage_logs: true
        }
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
