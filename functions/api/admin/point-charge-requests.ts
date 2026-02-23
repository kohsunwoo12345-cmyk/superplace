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
    // 관리자 인증 확인
    const authHeader = request.headers.get('Authorization');
    const tokenData = parseToken(authHeader);

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ADMIN 또는 SUPER_ADMIN만 접근 가능
    if (tokenData.role !== 'SUPER_ADMIN' && tokenData.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Only ADMIN or SUPER_ADMIN can access point charge requests' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { results } = await env.DB.prepare(`
      SELECT 
        pcr.*,
        u.name as userName,
        u.email as userEmail
      FROM PointChargeRequest pcr
      LEFT JOIN users u ON pcr.userId = u.id
      ORDER BY 
        CASE pcr.status
          WHEN 'PENDING' THEN 1
          WHEN 'APPROVED' THEN 2
          WHEN 'REJECTED' THEN 3
        END,
        pcr.createdAt DESC
    `).all();

    console.log('✅ Fetched point charge requests:', results.length);

    return new Response(JSON.stringify({ requests: results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch point charge requests:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch requests',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
