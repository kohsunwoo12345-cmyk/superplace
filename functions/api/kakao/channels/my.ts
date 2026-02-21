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
    // TODO: 사용자 인증 및 ID 가져오기
    const userId = 'user-id';

    const { results } = await env.DB.prepare(`
      SELECT 
        id as channelId,
        phoneNumber,
        channelName,
        categoryCode,
        status,
        createdAt
      FROM KakaoChannel
      WHERE userId = ?
      ORDER BY createdAt DESC
    `).bind(userId).all();

    return new Response(JSON.stringify({ channels: results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Failed to fetch channels:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch channels',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
