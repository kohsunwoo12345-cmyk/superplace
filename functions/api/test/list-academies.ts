/**
 * 학원 목록 조회 API (테스트용)
 * GET /api/test/list-academies
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { env } = context;
    const DB = env.DB;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Fetching academies...');

    // academy 테이블 조회
    const academies = await DB
      .prepare(`
        SELECT id, name, code, createdAt
        FROM academy
        ORDER BY id
      `)
      .all();

    // Academy 테이블 조회 (대문자)
    let academiesPascal = null;
    try {
      academiesPascal = await DB
        .prepare(`
          SELECT id, name, code, createdAt
          FROM Academy
          ORDER BY id
        `)
        .all();
    } catch (e: any) {
      console.log('Academy (PascalCase) 테이블이 없습니다:', e.message);
    }

    // 각 학원의 학원장 및 학생 수 조회
    const academyDetails: any[] = [];
    
    if (academies.results) {
      for (const academy of academies.results as any[]) {
        // users 테이블에서 학원장 조회
        const directors = await DB
          .prepare(`
            SELECT id, name, email, role
            FROM users
            WHERE academyId = ? AND role = 'DIRECTOR'
          `)
          .bind(academy.id)
          .all();

        // User 테이블에서 학원장 조회
        let directorsPascal = null;
        try {
          directorsPascal = await DB
            .prepare(`
              SELECT id, name, email, role
              FROM User
              WHERE academyId = ? AND role = 'DIRECTOR'
            `)
            .bind(academy.id)
            .all();
        } catch (e: any) {
          console.log('User (PascalCase) 조회 실패:', e.message);
        }

        // users 테이블에서 학생 수 조회
        const studentsCount = await DB
          .prepare(`
            SELECT COUNT(*) as count
            FROM users
            WHERE academyId = ? AND role = 'STUDENT'
          `)
          .bind(academy.id)
          .first();

        // User 테이블에서 학생 수 조회
        let studentsCountPascal = null;
        try {
          studentsCountPascal = await DB
            .prepare(`
              SELECT COUNT(*) as count
              FROM User
              WHERE academyId = ? AND role = 'STUDENT'
            `)
            .bind(academy.id)
            .first();
        } catch (e: any) {
          console.log('User (PascalCase) 조회 실패:', e.message);
        }

        academyDetails.push({
          ...academy,
          directors: directors.results,
          directorsPascal: directorsPascal?.results || [],
          studentsCount: studentsCount?.count || 0,
          studentsCountPascal: studentsCountPascal?.count || 0
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        academies: academyDetails,
        academiesPascal: academiesPascal?.results || [],
        totalCount: academies.results?.length || 0
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ List academies error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
