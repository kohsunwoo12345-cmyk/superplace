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

    // 사용자 인증 확인
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Point charge request from user:', tokenData.email);

    // 사용자 정보 조회 (이름, 이메일, academyId 포함)
    const user = await env.DB.prepare(`
      SELECT id, name, email, academyId FROM users WHERE id = ?
    `).bind(tokenData.id).first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id as string;
    const userName = user.name as string;
    const userEmail = user.email as string;
    const academyId = user.academyId as number | null;

    console.log('✅ User found:', { userId, userName, userEmail, academyId });

    if (!requestedPoints || requestedPoints < 1000) {
      return new Response(JSON.stringify({ error: 'Minimum 1,000 points required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requestId = `pcr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    // academyId 컬럼 추가 시도 (이미 있으면 무시됨)
    try {
      await env.DB.prepare(`
        ALTER TABLE PointChargeRequest ADD COLUMN academyId INTEGER
      `).run();
      console.log('✅ academyId column added to PointChargeRequest table');
    } catch (e) {
      // 컬럼이 이미 존재하면 무시
      console.log('ℹ️ academyId column already exists or error:', e);
    }

    // 포인트 충전 신청 생성 (academyId 포함)
    await env.DB.prepare(`
      INSERT INTO PointChargeRequest (
        id, userId, userName, userEmail, academyId,
        requestedPoints, pointPrice, vat, totalPrice,
        paymentMethod, depositBank, depositorName,
        attachmentUrl, requestMessage,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).bind(
      requestId, userId, userName, userEmail, academyId,
      requestedPoints, pointPrice, vat, totalPrice,
      paymentMethod, depositBank, depositorName,
      attachmentUrl, requestMessage,
      now, now
    ).run();

    console.log('✅ Point charge request created:', {
      requestId,
      userId,
      userName,
      academyId,
      requestedPoints
    });

    return new Response(JSON.stringify({ 
      success: true,
      requestId,
      message: 'Point charge request created successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to create point charge request:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create request',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
