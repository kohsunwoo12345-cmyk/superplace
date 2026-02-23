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

    console.log('🔍 Fetching my point charge requests:', tokenData.id);

    // 내 충전 신청 목록 조회
    const { results } = await env.DB.prepare(`
      SELECT * FROM PointChargeRequest
      WHERE userId = ?
      ORDER BY createdAt DESC
    `).bind(tokenData.id).all();

    console.log('✅ Fetched my requests:', results.length);

    return new Response(JSON.stringify({ requests: results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch my requests:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch requests',
      message: error.message,
      requests: [] // 에러 시에도 빈 배열 반환
    }), {
      status: 200, // 200으로 반환하여 프론트엔드에서 처리 가능하도록
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
