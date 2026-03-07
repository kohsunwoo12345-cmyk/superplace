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
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'userId is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Fetching landing pages for user: ${userId}`);

    // 실제 DB 구조에 맞게 수정 (landing_pages 테이블, user_id, status, created_at 컬럼 사용)
    const result = await env.DB.prepare(`
      SELECT 
        id,
        user_id,
        slug,
        title,
        template_type,
        view_count,
        status,
        created_at,
        updated_at
      FROM landing_pages
      WHERE user_id = ?
        AND (status IS NULL OR status = 'PUBLISHED' OR status = 'DRAFT')
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(parseInt(userId)).all();

    const landingPages = (result.results || []).map((lp: any) => ({
      id: lp.id,
      userId: lp.user_id,
      slug: lp.slug,
      title: lp.title,
      templateType: lp.template_type,
      viewCount: lp.view_count || 0,
      status: lp.status || 'DRAFT',
      createdAt: lp.created_at,
      updatedAt: lp.updated_at
    }));

    console.log(`✅ Found ${landingPages.length} landing pages for user ${userId}`);

    return new Response(JSON.stringify({ 
      success: true,
      landingPages,
      count: landingPages.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Failed to fetch landing pages:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Fetch failed',
      message: error.message || '랜딩페이지 조회에 실패했습니다.',
      details: error.toString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
