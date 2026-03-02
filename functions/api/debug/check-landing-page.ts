// Cloudflare Pages Function - 특정 랜딩페이지 DB 데이터 확인
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'slug 파라미터가 필요합니다' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Checking landing page:', slug);

    // 페이지 조회
    const page = await DB
      .prepare('SELECT * FROM landing_pages WHERE slug = ? LIMIT 1')
      .bind(slug)
      .first();

    if (!page) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: '페이지를 찾을 수 없습니다',
          slug 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 응답 데이터 구성
    const response = {
      success: true,
      page: {
        id: page.id,
        slug: page.slug,
        title: page.title,
        template_type: page.template_type,
        user_id: page.user_id,
        status: page.status,
        view_count: page.view_count,
        created_at: page.created_at,
        // HTML 콘텐츠 정보
        hasHtmlContent: !!page.html_content,
        htmlContentLength: page.html_content ? page.html_content.length : 0,
        htmlContentPreview: page.html_content 
          ? page.html_content.substring(0, 500) + '...'
          : null,
        // content_json 정보
        hasContentJson: !!page.content_json,
        contentJsonLength: page.content_json ? page.content_json.length : 0,
        contentJson: page.content_json 
          ? JSON.parse(page.content_json)
          : null,
      }
    };

    console.log('✅ Page found:', {
      slug: page.slug,
      hasHtml: !!page.html_content,
      htmlLength: page.html_content?.length || 0
    });

    return new Response(
      JSON.stringify(response, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        stack: error.stack 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
