// GET /api/stats - 공개 통계 (인증 불필요)
export async function onRequestGet(context) {
  try {
    const { env } = context;
    const db = env.DB;

    if (!db) {
      return new Response(JSON.stringify({ 
        error: 'Database not configured' 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    try {
      // 전체 사용자 수
      const totalUsers = await db
        .prepare("SELECT COUNT(*) as count FROM User")
        .first();

      // 역할별 사용자 수
      const usersByRole = await db
        .prepare(`
          SELECT 
            role,
            COUNT(*) as count
          FROM User
          GROUP BY role
          ORDER BY count DESC
        `)
        .all();

      // 전체 학원 수
      const totalAcademies = await db
        .prepare("SELECT COUNT(*) as count FROM Academy")
        .first();

      // SMS 발송 건수
      const totalSMS = await db
        .prepare("SELECT COUNT(*) as count FROM SMSLog WHERE status = 'success'")
        .first();

      return new Response(
        JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          stats: {
            totalUsers: totalUsers?.count || 0,
            usersByRole: usersByRole.results || [],
            totalAcademies: totalAcademies?.count || 0,
            totalSMSSent: totalSMS?.count || 0,
          }
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60'
          }
        }
      );
    } catch (dbError) {
      return new Response(
        JSON.stringify({ 
          error: "Database query failed",
          details: dbError.message,
          hint: "Some tables might not exist yet"
        }),
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
  } catch (error) {
    console.error("통계 조회 오류:", error);
    return new Response(
      JSON.stringify({ 
        error: "서버 오류가 발생했습니다",
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
