import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

// Token parser
function parseToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const parts = token.split('|');
  if (parts.length < 3) return null;
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 관리자 인증 확인
    const authHeader = request.headers.get('Authorization');
    console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing');
    
    const tokenData = parseToken(authHeader);
    console.log('👤 Token data:', tokenData);

    if (!tokenData) {
      console.error('❌ Unauthorized: No valid token');
      return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ User authenticated:', { id: tokenData.id, role: tokenData.role });

    // ADMIN 또는 SUPER_ADMIN만 승인 가능
    if (tokenData.role !== 'SUPER_ADMIN' && tokenData.role !== 'ADMIN') {
      console.error('❌ Forbidden: User role is', tokenData.role);
      return new Response(JSON.stringify({ error: 'Only ADMIN or SUPER_ADMIN can approve point charges', role: tokenData.role }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { requestId } = await request.json();
    console.log('📝 Request ID:', requestId);

    if (!requestId) {
      console.error('❌ No request ID provided');
      return new Response(JSON.stringify({ error: 'Request ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Approving point charge request:', requestId);

    // 요청 정보 조회 (academyId 포함)
    const requestInfo = await env.DB.prepare(`
      SELECT * FROM PointChargeRequest WHERE id = ?
    `).bind(requestId).first();

    if (!requestInfo) {
      return new Response(JSON.stringify({ error: 'Request not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (requestInfo.status !== 'PENDING') {
      return new Response(JSON.stringify({ error: 'Request already processed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Request found:', {
      userId: requestInfo.userId,
      points: requestInfo.requestedPoints || requestInfo.amount,
      academyId: requestInfo.academyId
    });

    const now = new Date().toISOString();
    
    // Get the points amount (support both old and new column names)
    const pointsToAdd = requestInfo.requestedPoints || requestInfo.amount;
    
    if (!pointsToAdd) {
      console.error('❌ No points amount found in request');
      return new Response(JSON.stringify({ error: 'Invalid request: no points amount' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. 요청 상태 업데이트
    await env.DB.prepare(`
      UPDATE PointChargeRequest
      SET status = 'APPROVED',
          approvedBy = ?,
          approvedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `).bind(tokenData.id, now, now, requestId).run();

    console.log('✅ Request status updated to APPROVED');

    // 2. Academy SMS 포인트 증가 (통합된 포인트 시스템)
    // requestInfo.academyId의 smsPoints 증가
    const academy = await env.DB.prepare(`
      SELECT id, name, smsPoints FROM Academy WHERE id = ?
    `).bind(requestInfo.academyId).first();

    if (!academy) {
      console.error('❌ Academy not found:', requestInfo.academyId);
      return new Response(JSON.stringify({ error: 'Academy not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const beforePoints = academy.smsPoints || 0;
    console.log('✅ Academy found:', { 
      id: academy.id,
      name: academy.name,
      currentPoints: beforePoints
    });

    console.log('💰 Point charge details:', {
      requestId,
      academyId: academy.id,
      academyName: academy.name,
      beforePoints,
      pointsToAdd,
      expectedAfterPoints: beforePoints + pointsToAdd
    });

    // 포인트 증가 (Academy 테이블의 smsPoints 사용)
    const updateResult = await env.DB.prepare(`
      UPDATE Academy
      SET smsPoints = COALESCE(smsPoints, 0) + ?
      WHERE id = ?
    `).bind(pointsToAdd, requestInfo.academyId).run();

    console.log('✅ Points UPDATE query executed:', {
      success: updateResult.success,
      changes: updateResult.meta?.changes || 0
    });

    // 3. 포인트 트랜잭션 로그 기록
    const transactionId = `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newBalance = beforePoints + pointsToAdd;
    
    await env.DB.prepare(`
      INSERT INTO point_transactions (
        id, academyId, userId, type, amount, balance, 
        description, relatedId, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      transactionId,
      requestInfo.academyId,
      tokenData.id, // approver ID
      'CHARGE',
      pointsToAdd,
      newBalance,
      `포인트 충전 승인 (요청 ID: ${requestId})`,
      requestId,
      now
    ).run();

    console.log('✅ Transaction logged:', transactionId);

    // 최종 포인트 확인 (Academy 테이블)
    const updatedAcademy = await env.DB.prepare(`
      SELECT id, name, smsPoints FROM Academy WHERE id = ?
    `).bind(requestInfo.academyId).first();

    if (!updatedAcademy) {
      console.error('❌ Failed to retrieve updated academy');
      return new Response(JSON.stringify({ 
        error: 'Failed to verify point update' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const afterPoints = updatedAcademy.smsPoints || 0;
    const actualIncrease = afterPoints - beforePoints;

    console.log('✅ Point increase completed:', {
      academyId: updatedAcademy.id,
      academyName: updatedAcademy.name,
      beforePoints,
      afterPoints,
      expectedIncrease: pointsToAdd,
      actualIncrease,
      match: actualIncrease === pointsToAdd
    });

    // 검증: 실제 증가량과 예상 증가량 비교
    if (actualIncrease !== pointsToAdd) {
      console.error('⚠️ Point increase mismatch!', {
        expected: pointsToAdd,
        actual: actualIncrease
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `포인트 충전이 승인되었습니다. ${pointsToAdd.toLocaleString()}P가 ${updatedAcademy.name} 학원에 추가되었습니다.`,
      data: {
        academyId: updatedAcademy.id,
        academyName: updatedAcademy.name,
        beforePoints,
        afterPoints,
        addedPoints: actualIncrease,
        requestedPoints: pointsToAdd,
        approvedAt: now,
        transactionId
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to approve point charge:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to approve',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
