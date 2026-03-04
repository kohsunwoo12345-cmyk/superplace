// API: DIRECTOR 계정 목록 조회 (디버깅용)
// GET /api/debug/directors

export async function onRequestGet(context) {
  const db = context.env.DB;
  
  try {
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: "DB 연결 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('🔍 DIRECTOR 계정 조회 중...');

    // User 테이블에서 DIRECTOR 역할 조회
    let directors = null;
    try {
      const result = await db.prepare(`
        SELECT 
          u.id, u.email, u.name, u.role, u.academyId, 
          a.name as academyName, a.code as academyCode
        FROM User u
        LEFT JOIN academy a ON u.academyId = a.id
        WHERE u.role = 'DIRECTOR'
        ORDER BY u.createdAt DESC
        LIMIT 20
      `).all();
      directors = result.results;
    } catch (e) {
      console.log('⚠️ User 테이블 조회 실패, users 테이블 시도');
      try {
        const result = await db.prepare(`
          SELECT 
            u.id, u.email, u.name, u.role, u.academyId,
            a.name as academyName, a.code as academyCode
          FROM users u
          LEFT JOIN academy a ON u.academyId = a.id
          WHERE u.role = 'DIRECTOR'
          ORDER BY u.createdAt DESC
          LIMIT 20
        `).all();
        directors = result.results;
      } catch (e2) {
        console.error('❌ users 테이블 조회도 실패:', e2.message);
      }
    }

    if (!directors || directors.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          directors: [],
          count: 0,
          message: 'DIRECTOR 계정이 없습니다'
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ ${directors.length}개의 DIRECTOR 계정 발견`);

    return new Response(
      JSON.stringify({
        success: true,
        directors: directors,
        count: directors.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("DIRECTOR 조회 오류:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "DIRECTOR 조회 실패",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
