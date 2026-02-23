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

    console.log('🔍 Fetching user points:', tokenData.id);

    // points 컬럼 추가 시도 (이미 있으면 무시됨)
    try {
      await env.DB.prepare(`
        ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0
      `).run();
      console.log('✅ Points column added to users table');
    } catch (e) {
      // 컬럼이 이미 존재하면 무시
      console.log('ℹ️ Points column already exists');
    }

    // 사용자 포인트 조회
    const user = await env.DB.prepare(`
      SELECT points FROM users WHERE id = ?
    `).bind(tokenData.id).first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found', points: 0 }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const points = user.points || 0;
    console.log('✅ User points:', points);

    return new Response(JSON.stringify({ points }), {
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
