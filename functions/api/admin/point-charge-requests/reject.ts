import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { requestId, reason } = await request.json();

    if (!requestId || !reason) {
      return new Response(JSON.stringify({ error: 'Request ID and reason are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TODO: 관리자 인증 확인
    const adminId = 'admin-user-id';

    // 요청 정보 조회
    const request_info = await env.DB.prepare(`
      SELECT * FROM PointChargeRequest WHERE id = ?
    `).bind(requestId).first();

    if (!request_info) {
      return new Response(JSON.stringify({ error: 'Request not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request_info.status !== 'PENDING') {
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
    `).bind(adminId, now, reason, now, requestId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Point charge rejected'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to reject point charge:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to reject',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
