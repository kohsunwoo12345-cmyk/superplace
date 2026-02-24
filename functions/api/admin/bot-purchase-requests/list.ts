// 관리자용 AI 쇼핑몰 구매 요청 목록 조회 API
export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized - No token provided' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 토큰으로 사용자 조회
    const userResult = await env.DB.prepare(
      'SELECT id, email, name, role FROM Users WHERE token = ?'
    ).bind(token).first();

    if (!userResult) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 관리자 권한 확인
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userResult.role)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Admin permission required' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // URL 파라미터에서 필터 조건 가져오기
    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // PENDING, APPROVED, REJECTED
    const academyId = url.searchParams.get('academyId');
    
    // 기본 쿼리
    let query = `
      SELECT 
        bpr.id,
        bpr.userId,
        bpr.academyId,
        bpr.productId,
        bpr.productName,
        bpr.studentCount,
        bpr.months,
        bpr.pricePerStudent,
        bpr.totalPrice,
        bpr.status,
        bpr.depositBank,
        bpr.depositorName,
        bpr.attachmentUrl,
        bpr.requestMessage,
        bpr.rejectionReason,
        bpr.createdAt,
        bpr.updatedAt,
        u.name as userName,
        u.email as userEmail,
        a.name as academyName
      FROM BotPurchaseRequest bpr
      LEFT JOIN Users u ON bpr.userId = u.id
      LEFT JOIN Academies a ON bpr.academyId = a.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // 상태 필터
    if (status && status !== 'ALL') {
      query += ' AND bpr.status = ?';
      params.push(status);
    }
    
    // 학원 필터
    if (academyId) {
      query += ' AND bpr.academyId = ?';
      params.push(academyId);
    }
    
    query += ' ORDER BY bpr.createdAt DESC';
    
    // 구매 요청 목록 조회
    let stmt = env.DB.prepare(query);
    if (params.length > 0) {
      stmt = stmt.bind(...params);
    }
    
    const { results: requests } = await stmt.all();

    // 통계 계산
    const stats = {
      total: requests.length,
      pending: requests.filter((r: any) => r.status === 'PENDING').length,
      approved: requests.filter((r: any) => r.status === 'APPROVED').length,
      rejected: requests.filter((r: any) => r.status === 'REJECTED').length,
      totalRevenue: requests
        .filter((r: any) => r.status === 'APPROVED')
        .reduce((sum: number, r: any) => sum + (r.totalPrice || 0), 0)
    };

    return new Response(JSON.stringify({
      success: true,
      data: {
        requests,
        stats
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('List bot purchase requests error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch purchase requests'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
