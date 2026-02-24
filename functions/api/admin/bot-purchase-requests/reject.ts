// 관리자용 구매 요청 거절 API
export async function onRequestPost(context: any) {
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
    const adminUser = await env.DB.prepare(
      'SELECT id, email, name, role FROM User WHERE token = ?'
    ).bind(token).first();

    if (!adminUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 관리자 권한 확인
    if (!['SUPER_ADMIN', 'ADMIN'].includes(adminUser.role)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Admin permission required' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { requestId, rejectionReason } = body;

    if (!requestId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Request ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 구매 요청 조회
    const purchaseRequest = await env.DB.prepare(`
      SELECT * FROM BotPurchaseRequest WHERE id = ?
    `).bind(requestId).first();

    if (!purchaseRequest) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Purchase request not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 이미 처리된 요청인지 확인
    if (purchaseRequest.status !== 'PENDING') {
      return new Response(JSON.stringify({
        success: false,
        error: `Request already ${purchaseRequest.status.toLowerCase()}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    // 구매 요청 상태를 REJECTED로 업데이트
    await env.DB.prepare(`
      UPDATE BotPurchaseRequest 
      SET status = 'REJECTED', 
          rejectedBy = ?,
          rejectedAt = ?,
          rejectionReason = ?,
          updatedAt = ?
      WHERE id = ?
    `).bind(
      adminUser.id,
      now,
      rejectionReason || 'No reason provided',
      now,
      requestId
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Purchase request rejected successfully',
      data: {
        requestId,
        rejectionReason: rejectionReason || 'No reason provided'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Reject purchase request error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to reject purchase request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
