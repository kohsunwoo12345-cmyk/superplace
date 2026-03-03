// PointChargeRequest 테이블 생성 API
// 포인트 충전 신청 관리 테이블

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    console.log("🔧 PointChargeRequest 테이블 생성 시작...");
    
    // PointChargeRequest 테이블 생성
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS PointChargeRequest (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        requestedPoints INTEGER NOT NULL,
        pointPrice INTEGER NOT NULL,
        vat INTEGER NOT NULL,
        totalPrice INTEGER NOT NULL,
        paymentMethod TEXT,
        depositBank TEXT,
        depositorName TEXT,
        attachmentUrl TEXT,
        requestMessage TEXT,
        status TEXT DEFAULT 'PENDING',
        approvedBy TEXT,
        approvedAt TEXT,
        rejectionReason TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES User(id)
      )
    `).run();
    
    console.log("✅ PointChargeRequest 테이블 생성 완료");
    
    // 인덱스 생성
    console.log("🔧 인덱스 생성 중...");
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_point_charge_request_userId 
      ON PointChargeRequest(userId)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_point_charge_request_status 
      ON PointChargeRequest(status)
    `).run();
    
    await DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_point_charge_request_createdAt 
      ON PointChargeRequest(createdAt)
    `).run();
    
    console.log("✅ 인덱스 생성 완료");
    
    // 테이블 존재 확인
    const tables = await DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name = 'PointChargeRequest'
    `).all();
    
    console.log("📊 생성된 테이블:", tables.results);
    
    // 테이블 스키마 확인
    const schema = await DB.prepare(`
      PRAGMA table_info(PointChargeRequest)
    `).all();
    
    console.log("📋 테이블 스키마:", schema.results);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "PointChargeRequest 테이블 생성 완료",
        table: "PointChargeRequest",
        created: true,
        schema: schema.results,
        columns: schema.results?.map((col: any) => ({
          name: col.name,
          type: col.type,
          notNull: col.notnull === 1,
          defaultValue: col.dflt_value
        }))
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
