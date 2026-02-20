interface Env {
  DB: D1Database;
}

/**
 * GET /api/debug/users
 * 사용자 목록 조회 (테스트용)
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

    console.log('🔍 Fetching users list...');

    // 모든 사용자 조회 (비밀번호 제외)
    const users = await DB.prepare(`
      SELECT 
        id, email, phone, name, role, academy_id, academyId, 
        created_at, user_type
      FROM users 
      WHERE role IN ('DIRECTOR', 'TEACHER', 'ADMIN', 'SUPER_ADMIN')
      LIMIT 10
    `).all();

    console.log('✅ Users fetched:', users.results?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        count: users.results?.length || 0,
        users: users.results
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ Users list error:', error);
    
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
