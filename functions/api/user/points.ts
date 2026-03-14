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

  if (request.method !== 'GET') {
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

    const userId = tokenData.id;
    const userEmail = tokenData.email;
    console.log('🔍 Fetching user points');
    console.log('Token data:', tokenData);
    console.log('UserId:', userId, 'Email:', userEmail);

    // User 테이블에서 포인트 조회 (최우선)
    let totalPoints = 0;
    try {
      console.log('Querying User table for points:', userId);
      const user = await env.DB.prepare(`
        SELECT points FROM users WHERE id = ?
      `).bind(userId).first();
      
      if (user) {
        totalPoints = user.points || 0;
        console.log('✅ User points from User table:', totalPoints);
      } else {
        console.log('⚠️ User not found in User table');
      }
    } catch (e: any) {
      console.log('⚠️ User table error:', e.message);
    }

    // User 테이블에 포인트가 없으면 point_transactions 테이블에서 조회
    if (totalPoints === 0) {
      try {
        console.log('Querying point_transactions with userEmail:', userEmail);
        const pointResult = await env.DB.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM point_transactions
          WHERE userEmail = ?
        `).bind(userEmail).all();
        
        const firstRow = pointResult.results?.[0];
        totalPoints = (firstRow as any)?.total || 0;
        console.log('✅ User points from transactions (by email):', totalPoints);
      } catch (e: any) {
        console.log('⚠️ point_transactions table error:', e.message);
      }
    }

    return new Response(JSON.stringify({ points: totalPoints }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch user points:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch points',
      message: error.message,
      points: 0
    }), {
      status: 200, // 에러 시에도 200으로 반환하여 기본값 0 사용
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
