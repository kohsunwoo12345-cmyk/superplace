interface Env {
  DB: D1Database;
}

// 출석 코드 테이블을 올바른 스키마로 재생성
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('🔄 Starting table recreation...');

    // 1. 기존 데이터 백업
    const existingCodes = await DB.prepare(`
      SELECT * FROM student_attendance_codes
    `).all();

    console.log(`📦 Backed up ${existingCodes.results.length} records`);

    // 2. 테이블 삭제
    await DB.prepare(`DROP TABLE IF EXISTS student_attendance_codes`).run();
    console.log('🗑️ Old table dropped');

    // 3. 올바른 스키마로 재생성
    await DB.prepare(`
      CREATE TABLE student_attendance_codes (
        id TEXT PRIMARY KEY,
        userId INTEGER NOT NULL,
        code TEXT UNIQUE NOT NULL,
        academyId INTEGER,
        classId TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now')),
        expiresAt TEXT
      )
    `).run();
    console.log('✅ New table created with INTEGER userId');

    // 4. 데이터 복원 (userId를 INTEGER로 변환)
    let restored = 0;
    let failed = 0;

    for (const record of existingCodes.results) {
      try {
        const userIdInt = parseInt(String(record.userId), 10);
        const academyIdInt = record.academyId ? parseInt(String(record.academyId), 10) : null;

        if (isNaN(userIdInt)) {
          console.error('❌ Invalid userId:', record.userId);
          failed++;
          continue;
        }

        await DB.prepare(`
          INSERT INTO student_attendance_codes 
          (id, userId, code, academyId, classId, isActive, createdAt, expiresAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          record.id,
          userIdInt,
          record.code,
          academyIdInt,
          record.classId || null,
          record.isActive || 1,
          record.createdAt,
          record.expiresAt || null
        ).run();

        restored++;

        if (restored % 50 === 0) {
          console.log(`✅ Restored ${restored} records...`);
        }
      } catch (err: any) {
        console.error('❌ Failed to restore:', record.id, err.message);
        failed++;
      }
    }

    console.log('🎉 Recreation complete!');

    return new Response(
      JSON.stringify({
        success: true,
        message: "Table recreated successfully",
        stats: {
          total: existingCodes.results.length,
          restored: restored,
          failed: failed,
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Recreation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Recreation failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
