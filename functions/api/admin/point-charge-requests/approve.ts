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
      points: requestInfo.requestedPoints,
      academyId: requestInfo.academyId
    });

    const now = new Date().toISOString();

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

    // 2. 사용자 포인트 증가 (User 테이블)
    // 사용자의 academyId와 role을 확인하고, 포인트 증가 전 상태 로깅
    const user = await env.DB.prepare(`
      SELECT id, email, name, role, academyId, points FROM users WHERE id = ?
    `).bind(requestInfo.userId).first();

    if (!user) {
      console.error('❌ User not found:', requestInfo.userId);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const beforePoints = user.points || 0;
    console.log('✅ User found:', { 
      id: user.id,
      email: user.email, 
      name: user.name,
      role: user.role,
      academyId: user.academyId,
      currentPoints: beforePoints
    });

    console.log('💰 Point charge details:', {
      requestId,
      userId: user.id,
      userRole: user.role,
      academyId: user.academyId,
      beforePoints,
      pointsToAdd: requestInfo.requestedPoints,
      expectedAfterPoints: beforePoints + requestInfo.requestedPoints
    });

    // points 컬럼 존재 확인 (User 테이블)
    try {
      await env.DB.prepare(`
        ALTER TABLE User ADD COLUMN points INTEGER DEFAULT 0
      `).run();
      console.log('✅ Points column added to User table');
    } catch (e) {
      // 컬럼이 이미 존재하면 무시
      console.log('ℹ️ Points column already exists in User table');
    }

    // 포인트 증가 (User 테이블 사용)
    // 원장(DIRECTOR) 또는 선생님(TEACHER) 계정에 포인트 증가
    const updateResult = await env.DB.prepare(`
      UPDATE User
      SET points = COALESCE(points, 0) + ?,
          updatedAt = ?
      WHERE id = ?
    `).bind(requestInfo.requestedPoints, now, requestInfo.userId).run();

    console.log('✅ Points UPDATE query executed:', {
      success: updateResult.success,
      changes: updateResult.meta?.changes || 0
    });

    // 최종 포인트 확인 (User 테이블)
    const updatedUser = await env.DB.prepare(`
      SELECT id, email, name, role, academyId, points FROM users WHERE id = ?
    `).bind(requestInfo.userId).first();

    if (!updatedUser) {
      console.error('❌ Failed to retrieve updated user');
      return new Response(JSON.stringify({ 
        error: 'Failed to verify point update' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const afterPoints = updatedUser.points || 0;
    const actualIncrease = afterPoints - beforePoints;

    console.log('✅ Point increase completed:', {
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      academyId: updatedUser.academyId,
      beforePoints,
      afterPoints,
      expectedIncrease: requestInfo.requestedPoints,
      actualIncrease,
      match: actualIncrease === requestInfo.requestedPoints
    });

    // 검증: 실제 증가량과 예상 증가량 비교
    if (actualIncrease !== requestInfo.requestedPoints) {
      console.error('⚠️ Point increase mismatch!', {
        expected: requestInfo.requestedPoints,
        actual: actualIncrease
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `포인트 충전이 승인되었습니다. ${requestInfo.requestedPoints.toLocaleString()}P가 ${updatedUser.role === 'DIRECTOR' ? '원장' : '사용자'} 계정에 추가되었습니다.`,
      data: {
        userId: updatedUser.id,
        userName: updatedUser.name,
        userEmail: updatedUser.email,
        userRole: updatedUser.role,
        academyId: updatedUser.academyId,
        beforePoints,
        afterPoints,
        addedPoints: actualIncrease,
        requestedPoints: requestInfo.requestedPoints,
        totalPrice: requestInfo.totalPrice,
        approvedAt: now
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
