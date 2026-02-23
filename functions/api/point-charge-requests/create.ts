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
  if (parts.length < 4) return null;
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2],
    academyId: parts[3] || null
  };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 사용자 인증 확인
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
    } = await request.json();

    // 유효성 검사
    if (!requestedPoints || requestedPoints < 1000) {
      return new Response(JSON.stringify({ error: 'Minimum 1,000 points required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!paymentMethod || !depositBank || !depositorName) {
      return new Response(JSON.stringify({ error: 'Payment information is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Creating point charge request:', {
      userId: tokenData.id,
      academyId: tokenData.academyId,
      requestedPoints
    });

    // PointChargeRequest 테이블 생성 (없으면)
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS PointChargeRequest (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          academyId TEXT,
          requestedPoints INTEGER NOT NULL,
          pointPrice INTEGER NOT NULL,
          vat INTEGER NOT NULL,
          totalPrice INTEGER NOT NULL,
          paymentMethod TEXT,
          depositBank TEXT,
          depositorName TEXT,
          attachmentUrl TEXT,
          requestMessage TEXT,
          status TEXT DEFAULT 'PENDING',
          approvedBy TEXT,
          approvedAt TEXT,
          rejectionReason TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `).run();
      console.log('✅ PointChargeRequest table created or already exists');
    } catch (e) {
      console.log('ℹ️ Table creation error (may already exist):', e);
    }

    const requestId = `pcr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    // 충전 신청 생성
    await env.DB.prepare(`
      INSERT INTO PointChargeRequest (
        id, userId, academyId, requestedPoints, pointPrice, vat, totalPrice,
        paymentMethod, depositBank, depositorName, attachmentUrl, requestMessage,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).bind(
      requestId,
      tokenData.id,
      tokenData.academyId,
      requestedPoints,
      pointPrice,
      vat,
      totalPrice,
      paymentMethod,
      depositBank,
      depositorName,
      attachmentUrl || null,
      requestMessage || null,
      now,
      now
    ).run();

    console.log('✅ Point charge request created:', requestId);

    return new Response(JSON.stringify({ 
      success: true,
      requestId,
      message: 'Point charge request submitted successfully'
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
