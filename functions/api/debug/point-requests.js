// 포인트 충전 데이터베이스 직접 조회 API

export async function onRequest(context) {
  const { env } = context;

  try {
    console.log('🔍 Checking PointChargeRequest table...');

    // 1. 전체 요청 개수
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM PointChargeRequest
    `).first();

    console.log(`📊 Total requests: ${countResult.total}`);

    // 2. 상태별 개수
    const statusCounts = await env.DB.prepare(`
      SELECT status, COUNT(*) as count FROM PointChargeRequest GROUP BY status
    `).all();

    // 3. 최근 10개 요청 (모든 정보)
    const recentRequests = await env.DB.prepare(`
      SELECT 
        pcr.*,
        u.name as userName,
        u.email as userEmail,
        u.academyId as userAcademyId,
        a.name as academyName,
        a.smsPoints as academySmsPoints
      FROM PointChargeRequest pcr
      LEFT JOIN User u ON pcr.userId = u.id
      LEFT JOIN Academy a ON (pcr.academyId = a.id OR u.academyId = a.id)
      ORDER BY pcr.createdAt DESC
      LIMIT 10
    `).all();

    // 4. academyId NULL인 요청 개수
    const nullAcademyCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM PointChargeRequest WHERE academyId IS NULL
    `).first();

    return new Response(JSON.stringify({
      success: true,
      summary: {
        totalRequests: countResult.total,
        statusCounts: statusCounts.results,
        nullAcademyIdCount: nullAcademyCount.count
      },
      recentRequests: recentRequests.results
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
