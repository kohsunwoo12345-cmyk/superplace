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

    // 1. DIRECTOR 역할을 가진 모든 사용자 찾기
    const directorsResult = await DB.prepare(`
      SELECT id, name, email, phone, createdAt
      FROM users 
      WHERE LOWER(role) = 'director'
      ORDER BY createdAt
    `).all();

    const directors = directorsResult.results || [];
    console.log("📋 Found directors:", directors.length);

    if (directors.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No directors found to create academies",
        migrated: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let migratedCount = 0;
    let updatedCount = 0;

    // 2. 각 디렉터에 대해 academy 생성 및 academyId 업데이트
    for (const director of directors) {
      const directorId = String(director.id);
      const academyId = directorId; // director의 id를 academyId로 사용
      
      // academy 테이블에 이미 존재하는지 확인
      const existing = await DB.prepare(`
        SELECT id FROM academy WHERE id = ?
      `).bind(academyId).first();

      if (!existing) {
        // academy 레코드 생성
        const academyName = `${director.name}의 학원`;
        const academyCode = `AC${String(directorId).padStart(6, '0')}`;
        
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
      } else {
        console.log(`⏭️  Academy ${academyId} already exists`);
      }

      // director의 academyId 업데이트 (본인 id로)
      await DB.prepare(`
        UPDATE users SET academyId = ? WHERE id = ?
      `).bind(academyId, directorId).run();
      
      updatedCount++;
      console.log(`✅ Updated director ${director.name} with academyId: ${academyId}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully migrated ${migratedCount} academies and updated ${updatedCount} directors`,
      migrated: migratedCount,
      updated: updatedCount,
      total: directors.length
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
