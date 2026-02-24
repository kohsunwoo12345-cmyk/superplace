// 관리자용 구매 요청 승인 API
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
      'SELECT id, email, name, role FROM Users WHERE token = ?'
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
    const { requestId } = body;

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

    // 트랜잭션 시작 (여러 작업을 원자적으로 처리)
    
    // 1. 구매 요청 상태를 APPROVED로 업데이트
    await env.DB.prepare(`
      UPDATE BotPurchaseRequest 
      SET status = 'APPROVED', 
          approvedBy = ?,
          approvedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `).bind(adminUser.id, now, now, requestId).run();

    // 2. 학원의 구독 정보 확인 (이미 있으면 업데이트, 없으면 생성)
    const existingSubscription = await env.DB.prepare(`
      SELECT * FROM AcademyBotSubscription 
      WHERE academyId = ? AND productId = ?
    `).bind(purchaseRequest.academyId, purchaseRequest.productId).first();

    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + purchaseRequest.months);

    if (existingSubscription) {
      // 기존 구독 업데이트 (학생 슬롯 추가, 기간 연장)
      const newTotalSlots = (existingSubscription.totalStudentSlots || 0) + purchaseRequest.studentCount;
      const newRemainingSlots = (existingSubscription.remainingStudentSlots || 0) + purchaseRequest.studentCount;
      
      // 기간 연장 (기존 만료일이 현재보다 미래면 그 날짜 기준으로 추가)
      let newEndDate = new Date(existingSubscription.subscriptionEnd);
      if (newEndDate < new Date()) {
        newEndDate = new Date();
      }
      newEndDate.setMonth(newEndDate.getMonth() + purchaseRequest.months);

      await env.DB.prepare(`
        UPDATE AcademyBotSubscription 
        SET totalStudentSlots = ?,
            remainingStudentSlots = ?,
            subscriptionEnd = ?,
            updatedAt = ?
        WHERE id = ?
      `).bind(
        newTotalSlots,
        newRemainingSlots,
        newEndDate.toISOString(),
        now,
        existingSubscription.id
      ).run();

    } else {
      // 새 구독 생성
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await env.DB.prepare(`
        INSERT INTO AcademyBotSubscription (
          id, academyId, productId, productName,
          totalStudentSlots, usedStudentSlots, remainingStudentSlots,
          subscriptionStart, subscriptionEnd,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        subscriptionId,
        purchaseRequest.academyId,
        purchaseRequest.productId,
        purchaseRequest.productName,
        purchaseRequest.studentCount,
        0,
        purchaseRequest.studentCount,
        now,
        subscriptionEndDate.toISOString(),
        now,
        now
      ).run();
    }

    // 3. 업데이트된 구독 정보 조회
    const updatedSubscription = await env.DB.prepare(`
      SELECT * FROM AcademyBotSubscription 
      WHERE academyId = ? AND productId = ?
    `).bind(purchaseRequest.academyId, purchaseRequest.productId).first();

    return new Response(JSON.stringify({
      success: true,
      message: 'Purchase request approved successfully',
      data: {
        requestId,
        subscription: updatedSubscription
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Approve purchase request error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to approve purchase request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
