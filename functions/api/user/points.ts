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
    role: parts[2],
    academyId: parts.length > 3 ? parts[3] : null
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
    let academyId = tokenData.academyId && tokenData.academyId.trim() !== '' ? tokenData.academyId : null;
    
    console.log('🔍 Fetching user points');
    console.log('Token data:', tokenData);
    console.log('UserId:', userId, 'Email:', userEmail, 'AcademyId:', academyId);

    // 1️⃣ 최우선: Academy 테이블의 smsPoints 조회 (통합 포인트 시스템)
    let totalPoints = 0;
    
    // academyId가 토큰에 없으면 DB에서 조회
    if (!academyId) {
      try {
        console.log('🔍 academyId not in token, querying from User table');
        const user = await env.DB.prepare(`
          SELECT academyId FROM User WHERE id = ?
        `).bind(userId).first();
        
        academyId = user?.academyId;
        console.log('✅ academyId from User table:', academyId);
      } catch (e: any) {
        console.log('⚠️ User table query failed, trying users table:', e.message);
        try {
          const user = await env.DB.prepare(`
            SELECT academyId FROM users WHERE id = ?
          `).bind(userId).first();
          
          academyId = user?.academyId;
          console.log('✅ academyId from users table:', academyId);
        } catch (e2: any) {
          console.log('⚠️ users table also failed:', e2.message);
        }
      }
    }
    
    // Academy 테이블에서 smsPoints 조회
    if (academyId) {
      try {
        console.log('🏫 Querying Academy table for smsPoints:', academyId);
        const academy = await env.DB.prepare(`
          SELECT id, name, smsPoints FROM Academy WHERE id = ?
        `).bind(academyId).first();
        
        if (academy) {
          totalPoints = academy.smsPoints || 0;
          console.log('✅ Academy smsPoints:', totalPoints, 'from', academy.name);
          
          // Academy 포인트를 찾았으면 즉시 반환
          return new Response(JSON.stringify({ 
            points: totalPoints,
            source: 'academy',
            academyId: academy.id,
            academyName: academy.name
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          console.log('⚠️ Academy not found for id:', academyId);
        }
      } catch (e: any) {
        console.log('⚠️ Academy table error:', e.message);
      }
    } else {
      console.log('⚠️ No academyId found in token or DB');
    }

    // 2️⃣ Fallback: User 테이블의 개인 포인트 조회
    if (totalPoints === 0) {
      try {
        console.log('📝 Fallback: Querying users table for individual points:', userId);
        const user = await env.DB.prepare(`
          SELECT points FROM users WHERE id = ?
        `).bind(userId).first();
        
        if (user) {
          totalPoints = user.points || 0;
          console.log('✅ User points from users table:', totalPoints);
        } else {
          console.log('⚠️ User not found in users table');
        }
      } catch (e: any) {
        console.log('⚠️ users table error:', e.message);
      }
    }

    // 3️⃣ Final fallback: point_transactions 테이블에서 조회
    if (totalPoints === 0) {
      try {
        console.log('📊 Final fallback: Querying point_transactions with userEmail:', userEmail);
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

    return new Response(JSON.stringify({ 
      points: totalPoints,
      source: totalPoints > 0 ? 'fallback' : 'none'
    }), {
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
