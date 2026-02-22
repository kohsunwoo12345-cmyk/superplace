interface Env {
  DB: D1Database;
}

/**
 * GET /api/debug/students-by-academy?academyId=1
 * 학원별 학생 목록 조회 (인증 없이 테스트용)
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

    const url = new URL(context.request.url);
    const academyId = url.searchParams.get("academyId") || "1";

    console.log('🔍 Fetching students for academy:', academyId);

    // 학원별 학생 조회
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.academy_id as academyId,
        u.role,
        s.id as studentId,
        s.grade,
        s.status
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.role = 'STUDENT'
        AND u.academy_id = ?
      ORDER BY u.id DESC
      LIMIT 50
    `;

    console.log('📊 Query:', query);
    console.log('📊 Binding:', parseInt(academyId));

    const result = await DB.prepare(query).bind(parseInt(academyId)).all();

    console.log('✅ Found students:', result.results?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        academyId: parseInt(academyId),
        count: result.results?.length || 0,
        students: result.results
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ Students by academy error:', error);
    
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
