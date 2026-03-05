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
    // 사용자 인증 (선택)
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    // 토큰이 있으면 검증, 없으면 외부 사용자로 처리
    let userId = 'external-user';
    let userAcademyId = null;

    if (tokenData) {
      userId = tokenData.id;
      userAcademyId = tokenData.academyId;
      console.log('✅ Authenticated user:', { userId, userAcademyId });
    } else {
      console.log('ℹ️ External user purchase request (no token)');
    }

    const {
      productId,
      productName,
      studentCount,
      months,
      pricePerStudent,
      totalPrice,
      email,
      name,
      academyName,
      phoneNumber,
      requestMessage
    } = await request.json();

    // 유효성 검사
    if (!productId || !productName || !studentCount || !months || !pricePerStudent) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (studentCount < 1 || months < 1) {
      return new Response(JSON.stringify({ error: 'Student count and months must be at least 1' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🛒 Creating bot purchase request:', {
      productId,
      userId,
      academyId: userAcademyId,
      studentCount,
      months,
      email,
      name,
      academyName
    });

    // BotPurchaseRequest 테이블 생성 및 마이그레이션
    try {
      // 1. 테이블이 없으면 생성
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS BotPurchaseRequest (
          id TEXT PRIMARY KEY,
          productId TEXT NOT NULL,
          productName TEXT NOT NULL,
          userId TEXT NOT NULL,
          academyId TEXT NOT NULL,
          studentCount INTEGER NOT NULL,
          months INTEGER NOT NULL,
          pricePerStudent INTEGER NOT NULL,
          totalPrice INTEGER NOT NULL,
          email TEXT,
          name TEXT,
          requestAcademyName TEXT,
          phoneNumber TEXT,
          requestMessage TEXT,
          status TEXT DEFAULT 'PENDING',
          approvedBy TEXT,
          approvedAt TEXT,
          rejectionReason TEXT,
          subscriptionStartDate TEXT,
          subscriptionEndDate TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `).run();
      console.log('✅ BotPurchaseRequest table created or already exists');

      // 2. 기존 테이블에 컬럼 추가 (없으면)
      const columnsToAdd = ['email', 'name', 'requestAcademyName', 'phoneNumber'];
      for (const column of columnsToAdd) {
        try {
          await env.DB.prepare(`
            ALTER TABLE BotPurchaseRequest ADD COLUMN ${column} TEXT
          `).run();
          console.log(`✅ Added column: ${column}`);
        } catch (alterError: any) {
          if (alterError.message && alterError.message.includes('duplicate column')) {
            console.log(`ℹ️ Column ${column} already exists`);
          } else {
            console.error(`⚠️ Failed to add column ${column}:`, alterError.message);
          }
        }
      }
    } catch (e: any) {
      console.log('ℹ️ Table setup error:', e.message);
      // Continue anyway - the INSERT will fail if columns are missing
    }

    const requestId = `bpr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    // 구매 신청 생성
    await env.DB.prepare(`
      INSERT INTO BotPurchaseRequest (
        id, productId, productName, userId, academyId,
        studentCount, months, pricePerStudent, totalPrice,
        email, name, requestAcademyName, phoneNumber, requestMessage,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).bind(
      requestId,
      productId,
      productName,
      userId,
      userAcademyId || 'external',
      studentCount,
      months,
      pricePerStudent,
      totalPrice,
      email || null,
      name || null,
      academyName || null,
      phoneNumber || null,
      requestMessage || null,
      now,
      now
    ).run();

    console.log('✅ Bot purchase request created:', requestId);

    return new Response(JSON.stringify({ 
      success: true,
      requestId,
      message: 'Purchase request submitted successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to create purchase request:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create request',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
