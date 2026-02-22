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
    const body = await request.json();
    const {
      requestedPoints,
      pointPrice,
      vat,
      totalPrice,
      paymentMethod,
      depositBank,
      depositorName,
      attachmentUrl,
      requestMessage
    } = body;

    // TODO: 사용자 인증 및 정보 가져오기
    const userId = 'user-id'; // 실제로는 세션에서 가져와야 함
    const userName = 'User Name';
    const userEmail = 'user@example.com';

    if (!requestedPoints || requestedPoints < 1000) {
      return new Response(JSON.stringify({ error: 'Minimum 1,000 points required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requestId = `pcr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO PointChargeRequest (
        id, userId, userName, userEmail,
        requestedPoints, pointPrice, vat, totalPrice,
        paymentMethod, depositBank, depositorName,
        attachmentUrl, requestMessage,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).bind(
      requestId, userId, userName, userEmail,
      requestedPoints, pointPrice, vat, totalPrice,
      paymentMethod, depositBank, depositorName,
      attachmentUrl, requestMessage,
      now, now
    ).run();

    return new Response(JSON.stringify({ 
      success: true,
      requestId,
      message: 'Point charge request created successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to create point charge request:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create request',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
