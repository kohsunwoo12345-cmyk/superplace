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
    const { requestId } = await request.json();

    if (!requestId) {
      return new Response(JSON.stringify({ error: 'Request ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TODO: 관리자 인증 확인 및 사용자 ID 가져오기
    const adminId = 'admin-user-id'; // 실제로는 세션에서 가져와야 함

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

    // 트랜잭션으로 처리
    const now = new Date().toISOString();

    // 1. 요청 상태 업데이트
    await env.DB.prepare(`
      UPDATE PointChargeRequest
      SET status = 'APPROVED',
          approvedBy = ?,
          approvedAt = ?,
          updatedAt = ?
      WHERE id = ?
    `).bind(adminId, now, now, requestId).run();

    // 2. 사용자 포인트 증가
    await env.DB.prepare(`
      UPDATE User
      SET points = points + ?,
          updatedAt = ?
      WHERE id = ?
    `).bind(request_info.requestedPoints, now, request_info.userId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Point charge approved'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to approve point charge:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to approve',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
