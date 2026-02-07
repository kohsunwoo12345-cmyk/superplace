interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🔄 Starting academy migration...");

    // 1. users 테이블에서 고유한 academyId 찾기
    const academyIdsResult = await DB.prepare(`
      SELECT DISTINCT academyId 
      FROM users 
      WHERE academyId IS NOT NULL 
        AND academyId != '' 
        AND role IN ('DIRECTOR', 'TEACHER', 'STUDENT')
    `).all();

    const academyIds = (academyIdsResult.results || []).map((r: any) => r.academyId);
    console.log("📋 Found academyIds:", academyIds);

    if (academyIds.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No academies to migrate",
        migrated: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let migratedCount = 0;

    // 2. 각 academyId에 대해 academy 레코드 생성
    for (const academyId of academyIds) {
      // academy 테이블에 이미 존재하는지 확인
      const existing = await DB.prepare(`
        SELECT id FROM academy WHERE id = ?
      `).bind(academyId).first();

      if (existing) {
        console.log(`⏭️  Academy ${academyId} already exists, skipping...`);
        continue;
      }

      // 해당 학원의 학원장 정보 가져오기
      const director = await DB.prepare(`
        SELECT id, name, email, phone, createdAt
        FROM users
        WHERE academyId = ? AND role = 'DIRECTOR'
        LIMIT 1
      `).bind(academyId).first();

      if (!director) {
        console.log(`⚠️  No director found for academyId ${academyId}, skipping...`);
        continue;
      }

      // academy 레코드 생성
      const academyName = `${director.name}의 학원`;
      const academyCode = `AC${String(academyId).padStart(6, '0')}`;
      
      await DB.prepare(`
        INSERT INTO academy (
          id, name, code, description, address, phone, email,
          subscriptionPlan, maxStudents, maxTeachers, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        academyId,
        academyName,
        academyCode,
        `${academyName} - 스마트 학원 관리 시스템`,
        null,
        director.phone || null,
        director.email,
        'FREE',
        100,
        10,
        1,
        director.createdAt || new Date().toISOString(),
        new Date().toISOString()
      ).run();

      console.log(`✅ Created academy: ${academyName} (ID: ${academyId})`);
      migratedCount++;
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully migrated ${migratedCount} academies`,
      migrated: migratedCount,
      total: academyIds.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Academy migration error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to migrate academies",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
