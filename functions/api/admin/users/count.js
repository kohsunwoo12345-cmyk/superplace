// GET /api/admin/users/count - 전체 사용자 수 조회 (공개)
export async function onRequestGet(context) {
  try {
    const { env } = context;
    const db = env.DB;

    if (!db) {
      return new Response(JSON.stringify({ 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // 전체 사용자 수
      const totalResult = await db
        .prepare("SELECT COUNT(*) as count FROM User")
        .first();

      // 역할별 사용자 수
      const byRoleResult = await db
        .prepare(`
          SELECT 
            role,
            COUNT(*) as count
          FROM User
          GROUP BY role
          ORDER BY count DESC
        `)
        .all();

      // 승인 대기 사용자 수
      const pendingResult = await db
        .prepare("SELECT COUNT(*) as count FROM User WHERE approved = 0")
        .first();

      // 최근 가입 사용자 (최근 10명 - 이메일만)
      const recentUsersResult = await db
        .prepare(`
          SELECT 
            email,
            role,
            createdAt
          FROM User
          ORDER BY createdAt DESC
          LIMIT 10
        `)
        .all();

      return new Response(
        JSON.stringify({
          success: true,
          total: totalResult?.count || 0,
          byRole: byRoleResult.results || [],
          pending: pendingResult?.count || 0,
          recentUsers: recentUsersResult.results || [],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    } catch (dbError) {
      return new Response(
        JSON.stringify({ 
          error: "Database query failed",
          details: dbError.message,
          hint: "User table might not exist"
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error("사용자 수 조회 오류:", error);
    return new Response(
      JSON.stringify({ 
        error: "서버 오류가 발생했습니다",
        details: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
