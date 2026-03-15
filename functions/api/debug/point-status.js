// 포인트 디버그 API - 인증 없이 전체 데이터 확인
// GET /api/debug/point-status

export async function onRequest(context) {
  const { env } = context;

  try {
    console.log('🔍 Point Debug API called');

    // 1. Academy 테이블 전체 조회
    const academies = await env.DB.prepare(`
      SELECT id, name, smsPoints, createdAt FROM Academy ORDER BY createdAt DESC LIMIT 10
    `).all();

    console.log('📦 Academies:', academies.results?.length || 0);

    // 2. User 테이블에서 관리자 조회
    const admins = await env.DB.prepare(`
      SELECT id, email, role, academyId, name FROM User 
      WHERE role IN ('ADMIN', 'SUPER_ADMIN', 'DIRECTOR') 
      ORDER BY createdAt DESC LIMIT 10
    `).all();

    console.log('👤 Admins:', admins.results?.length || 0);

    // 3. PointChargeRequest 조회
    const requests = await env.DB.prepare(`
      SELECT id, userId, academyId, requestedPoints, amount, status, createdAt 
      FROM PointChargeRequest 
      ORDER BY createdAt DESC LIMIT 10
    `).all();

    console.log('📝 Requests:', requests.results?.length || 0);

    // 4. point_transactions 조회
    let transactions = { results: [] };
    try {
      transactions = await env.DB.prepare(`
        SELECT id, academyId, type, amount, balance, createdAt 
        FROM point_transactions 
        ORDER BY createdAt DESC LIMIT 10
      `).all();
      console.log('💰 Transactions:', transactions.results?.length || 0);
    } catch (e) {
      console.log('⚠️ point_transactions 테이블 없음:', e.message);
    }

    // 5. Academy별 포인트 합계
    const totalPoints = await env.DB.prepare(`
      SELECT SUM(smsPoints) as total FROM Academy
    `).first();

    console.log('💵 Total SMS Points:', totalPoints?.total || 0);

    // 6. PENDING 요청과 Academy 매칭 확인
    const pendingRequests = requests.results?.filter(r => r.status === 'PENDING') || [];
    const pendingDetails = [];

    for (const req of pendingRequests) {
      const academy = academies.results?.find(a => a.id === req.academyId);
      const user = admins.results?.find(u => u.id === req.userId);
      
      pendingDetails.push({
        requestId: req.id,
        userId: req.userId,
        userName: user?.name || user?.email || 'Unknown',
        userAcademyId: user?.academyId,
        requestAcademyId: req.academyId,
        academyName: academy?.name || 'Not found',
        academyPoints: academy?.smsPoints || 0,
        requestedPoints: req.requestedPoints || req.amount,
        match: req.academyId === academy?.id,
        userMatch: req.academyId === user?.academyId
      });
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalAcademies: academies.results?.length || 0,
        totalAdmins: admins.results?.length || 0,
        totalRequests: requests.results?.length || 0,
        pendingRequests: pendingRequests.length,
        totalTransactions: transactions.results?.length || 0,
        totalSmsPoints: totalPoints?.total || 0
      },
      academies: academies.results?.map(a => ({
        id: a.id,
        name: a.name,
        smsPoints: a.smsPoints,
        createdAt: a.createdAt
      })) || [],
      admins: admins.results?.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        academyId: u.academyId
      })) || [],
      requests: requests.results?.map(r => ({
        id: r.id,
        userId: r.userId,
        academyId: r.academyId,
        requestedPoints: r.requestedPoints || r.amount,
        status: r.status,
        createdAt: r.createdAt
      })) || [],
      transactions: transactions.results?.map(t => ({
        id: t.id,
        academyId: t.academyId,
        type: t.type,
        amount: t.amount,
        balance: t.balance,
        createdAt: t.createdAt
      })) || [],
      pendingDetails,
      diagnostics: {
        hasAcademies: (academies.results?.length || 0) > 0,
        hasAdmins: (admins.results?.length || 0) > 0,
        hasRequests: (requests.results?.length || 0) > 0,
        hasPendingRequests: pendingRequests.length > 0,
        adminsWithAcademyId: admins.results?.filter(u => u.academyId).length || 0,
        adminsWithoutAcademyId: admins.results?.filter(u => !u.academyId).length || 0,
        academiesWithPoints: academies.results?.filter(a => (a.smsPoints || 0) > 0).length || 0,
        academiesWithZeroPoints: academies.results?.filter(a => (a.smsPoints || 0) === 0).length || 0
      }
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ Debug API error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
