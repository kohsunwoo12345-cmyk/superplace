import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // TODO: 사용자 인증 확인 (관리자만 접근 가능)
    
    const { results } = await env.DB.prepare(`
      SELECT 
        pcr.*,
        u.name as userName,
        u.email as userEmail
      FROM PointChargeRequest pcr
      LEFT JOIN User u ON pcr.userId = u.id
      ORDER BY 
        CASE pcr.status
          WHEN 'PENDING' THEN 1
          WHEN 'APPROVED' THEN 2
          WHEN 'REJECTED' THEN 3
        END,
        pcr.createdAt DESC
    `).all();

    return new Response(JSON.stringify({ requests: results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to fetch point charge requests:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch requests',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
