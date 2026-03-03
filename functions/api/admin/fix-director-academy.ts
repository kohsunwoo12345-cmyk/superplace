// academyId가 없는 학원장 계정에 Academy 자동 생성 및 연결
interface Env {
  DB: D1Database;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateAcademyCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🔍 학원장 계정 중 academyId 없는 계정 찾기...");

    // academyId가 null인 DIRECTOR 계정 찾기
    const directorsWithoutAcademy = await DB.prepare(`
      SELECT id, name, email, phone
      FROM User
      WHERE role = 'DIRECTOR' AND (academyId IS NULL OR academyId = '')
    `).all();

    if (!directorsWithoutAcademy.results || directorsWithoutAcademy.results.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "모든 학원장 계정이 학원에 연결되어 있습니다.",
        count: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📊 총 ${directorsWithoutAcademy.results.length}명의 학원장 계정에 academyId가 없습니다.`);

    const results = [];

    for (const director of directorsWithoutAcademy.results) {
      try {
        // 학원 생성
        const academyId = generateId('academy');
        const academyCode = generateAcademyCode();
        const academyName = `${director.name}의 학원`;

        console.log(`🏫 학원 생성 중: ${academyName} (${academyCode})`);

        await DB.prepare(`
          INSERT INTO Academy (
            id, name, code, address, phone, email, 
            subscriptionPlan, maxStudents, maxTeachers, 
            isActive, createdAt, updatedAt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          academyId,
          academyName,
          academyCode,
          '주소 미입력',
          director.phone || '',
          director.email,
          'FREE',
          10,
          2,
          1
        ).run();

        // User 테이블에 academyId 업데이트
        await DB.prepare(`
          UPDATE User
          SET academyId = ?, updatedAt = datetime('now')
          WHERE id = ?
        `).bind(academyId, director.id).run();

        console.log(`✅ 학원장 ${director.name}에게 학원 ${academyCode} 연결 완료`);

        results.push({
          userId: director.id,
          userName: director.name,
          userEmail: director.email,
          academyId: academyId,
          academyName: academyName,
          academyCode: academyCode,
          status: 'success'
        });

      } catch (error: any) {
        console.error(`❌ 학원장 ${director.name} 처리 실패:`, error.message);
        results.push({
          userId: director.id,
          userName: director.name,
          userEmail: director.email,
          status: 'failed',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    return new Response(JSON.stringify({
      success: true,
      message: `학원 자동 생성 완료: 성공 ${successCount}건, 실패 ${failCount}건`,
      totalProcessed: results.length,
      successCount,
      failCount,
      details: results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Migration error:", error);
    return new Response(JSON.stringify({
      error: "Failed to migrate directors",
      message: error.message,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
