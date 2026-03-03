// 사용량 알림 테이블 생성 API
// usage_alerts 테이블 생성 (새 테이블)

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    console.log("🚀 usage_alerts 테이블 생성 시작...");
    
    // usage_alerts 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS usage_alerts (
        id TEXT PRIMARY KEY,
        academyId TEXT NOT NULL,
        directorId TEXT NOT NULL,
        type TEXT NOT NULL,
        current INTEGER NOT NULL,
        limit INTEGER NOT NULL,
        percentage INTEGER NOT NULL,
        threshold INTEGER NOT NULL,
        planName TEXT,
        notified INTEGER DEFAULT 0,
        notifiedAt TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (academyId) REFERENCES academy(id),
        FOREIGN KEY (directorId) REFERENCES User(id)
      )
    `).run();
    
    console.log("✅ usage_alerts 테이블 생성 완료");
    
    // 인덱스 생성
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_alerts_academy 
      ON usage_alerts(academyId)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_alerts_director 
      ON usage_alerts(directorId)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_alerts_created 
      ON usage_alerts(createdAt)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_usage_alerts_type_threshold 
      ON usage_alerts(type, threshold)
    `).run();
    
    console.log("✅ usage_alerts 인덱스 생성 완료");
    
    return new Response(JSON.stringify({
      success: true,
      message: "usage_alerts 테이블 및 인덱스 생성 완료",
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error: any) {
    console.error("테이블 생성 오류:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "테이블 생성 실패",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
