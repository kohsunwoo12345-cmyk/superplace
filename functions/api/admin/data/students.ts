interface Env {
  DB: D1Database;
}

/**
 * GET /api/admin/data/students
 * 학생 데이터 확인 (디버깅용)
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    if (!DB) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. users 테이블에서 role='STUDENT' 조회
    const usersResult = await DB.prepare(`
      SELECT id, name, email, role, academy_id
      FROM users
      WHERE role = 'STUDENT'
      ORDER BY id
      LIMIT 10
    `).all();

    // 2. students 테이블 조회
    const studentsResult = await DB.prepare(`
      SELECT id, user_id, academy_id, status
      FROM students
      ORDER BY id
      LIMIT 10
    `).all();

    // 3. users 테이블의 전체 role 통계
    const rolesResult = await DB.prepare(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY count DESC
    `).all();

    return new Response(
      JSON.stringify({
        success: true,
        usersTable: {
          count: usersResult.results?.length || 0,
          students: usersResult.results || []
        },
        studentsTable: {
          count: studentsResult.results?.length || 0,
          students: studentsResult.results || []
        },
        roleStats: rolesResult.results || []
      }, null, 2),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Check students error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to check students",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
