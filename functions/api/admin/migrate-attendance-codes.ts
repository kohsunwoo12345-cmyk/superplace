interface Env {
  DB: D1Database;
}

// 기존 TEXT userId를 INTEGER로 마이그레이션
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    
    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('🔄 Starting migration of attendance codes...');

    // 1. 모든 출석 코드 조회
    const allCodes = await DB.prepare(`
      SELECT id, userId, code, academyId, classId, isActive, createdAt 
      FROM student_attendance_codes
    `).all();

    console.log(`📊 Found ${allCodes.results.length} attendance codes`);

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    // 2. 각 코드의 userId 타입 확인 및 변환
    for (const record of allCodes.results) {
      const currentUserId = record.userId;
      const currentUserIdType = typeof currentUserId;

      // 이미 INTEGER면 스킵
      if (currentUserIdType === 'number') {
        skipped++;
        continue;
      }

      // TEXT를 INTEGER로 변환 시도
      const userIdInt = parseInt(String(currentUserId), 10);
      
      if (isNaN(userIdInt)) {
        console.error('❌ Cannot convert userId:', currentUserId);
        failed++;
        continue;
      }

      // 업데이트
      try {
        await DB.prepare(`
          UPDATE student_attendance_codes 
          SET userId = ? 
          WHERE id = ?
        `).bind(userIdInt, record.id).run();
        
        updated++;
        
        if (updated % 10 === 0) {
          console.log(`✅ Updated ${updated} codes...`);
        }
      } catch (err: any) {
        console.error('❌ Failed to update:', record.id, err.message);
        failed++;
      }
    }

    console.log('🎉 Migration complete!');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Migration completed",
        stats: {
          total: allCodes.results.length,
          updated: updated,
          skipped: skipped,
          failed: failed,
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Migration failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
