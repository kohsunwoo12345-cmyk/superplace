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
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // SUPER_ADMIN만 승인 가능
    if (tokenData.role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({ error: 'Only SUPER_ADMIN can approve point charges' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { requestId } = await request.json();

    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Request ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Approving point charge request:', requestId);

    // 요청 정보 조회
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
      points: requestInfo.requestedPoints
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

    // 2. 사용자 포인트 증가 (users 테이블, camelCase 사용)
    // points 컬럼이 없을 수 있으므로 먼저 확인
    const user = await env.DB.prepare(`
      SELECT id, email, name FROM users WHERE id = ?
    `).bind(requestInfo.userId).first();

    if (!user) {
      console.error('❌ User not found:', requestInfo.userId);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ User found:', user.email);

    // points 컬럼 추가 시도 (이미 있으면 무시됨)
    try {
      await env.DB.prepare(`
        ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0
      `).run();
      console.log('✅ Points column added to users table');
    } catch (e) {
      // 컬럼이 이미 존재하면 무시
      console.log('ℹ️ Points column already exists or error:', e);
    }

    // 포인트 증가
    await env.DB.prepare(`
      UPDATE users
      SET points = COALESCE(points, 0) + ?,
          updatedAt = ?
      WHERE id = ?
    `).bind(requestInfo.requestedPoints, now, requestInfo.userId).run();

    console.log('✅ User points updated:', {
      userId: requestInfo.userId,
      addedPoints: requestInfo.requestedPoints
    });

    // 최종 포인트 확인
    const updatedUser = await env.DB.prepare(`
      SELECT points FROM users WHERE id = ?
    `).bind(requestInfo.userId).first();

    console.log('✅ Final user points:', updatedUser?.points || 0);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Point charge approved',
      points: updatedUser?.points || 0
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
