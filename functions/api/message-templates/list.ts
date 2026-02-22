import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// JWT 토큰에서 사용자 정보 추출
async function getUserFromToken(token: string, secret: string): Promise<any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token, env.JWT_SECRET);

    // 메시지 템플릿 목록 조회
    const result = await env.DB.prepare(`
      SELECT 
        id,
        name,
        messageType,
        content,
        category,
        usageCount
      FROM MessageTemplate
      WHERE userId = ? AND isActive = 1
      ORDER BY usageCount DESC, createdAt DESC
    `).bind(user.id || user.userId).all();

    const templates = result.results || [];

    return new Response(JSON.stringify({ 
      success: true,
      templates
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Failed to fetch message templates:', error);
    return new Response(JSON.stringify({ 
      error: 'Fetch failed',
      message: error.message || '템플릿 조회에 실패했습니다.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
