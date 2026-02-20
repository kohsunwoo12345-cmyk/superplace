interface Env {
  DB: D1Database;
}

/**
 * GET /api/debug/students
 * 학생 목록 조회 (테스트용)
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

    console.log('🔍 Fetching students list...');

    // 최근 추가된 학생 20명 조회
    const students = await DB.prepare(`
      SELECT 
        id, email, phone, name, role, academy_id, 
        created_at, school, grade
      FROM users 
      WHERE role = 'STUDENT'
      ORDER BY id DESC
      LIMIT 20
    `).all();

    console.log('✅ Students fetched:', students.results?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        count: students.results?.length || 0,
        students: students.results
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ Students list error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
