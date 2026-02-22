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

    // SUPER_ADMIN만 거절 가능
    if (tokenData.role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({ error: 'Only SUPER_ADMIN can reject point charges' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { requestId, reason } = await request.json();

    if (!requestId || !reason) {
      return new Response(JSON.stringify({ error: 'Request ID and reason are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Rejecting point charge request:', requestId);

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

    const now = new Date().toISOString();

    // 요청 거절 처리
    await env.DB.prepare(`
      UPDATE PointChargeRequest
      SET status = 'REJECTED',
          approvedBy = ?,
          approvedAt = ?,
          rejectionReason = ?,
          updatedAt = ?
      WHERE id = ?
    `).bind(tokenData.id, now, reason, now, requestId).run();

    console.log('✅ Request rejected:', requestId);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Point charge rejected'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to reject point charge:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to reject',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
