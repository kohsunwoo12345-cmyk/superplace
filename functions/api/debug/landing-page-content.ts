// 랜딩페이지 HTML 내용 확인 API
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}) {
  try {
    const { request, env } = context;
    const db = env.DB;
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    
    if (!slug) {
      return new Response(JSON.stringify({
        error: 'slug parameter required',
        usage: '/api/debug/landing-page-content?slug=lp_xxxxx'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('🔍 Checking landing page:', slug);
    
    // 랜딩페이지 조회
    const page = await db.prepare(`
      SELECT 
        id, slug, title, subtitle, html_content, 
        template_type, status, created_at
      FROM landing_pages 
      WHERE slug = ?
    `).bind(slug).first();
    
    if (!page) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Landing page not found',
        slug: slug
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const htmlContent = page.html_content || '';
    
    return new Response(JSON.stringify({
      success: true,
      page: {
        id: page.id,
        slug: page.slug,
        title: page.title,
        subtitle: page.subtitle,
        templateType: page.template_type,
        status: page.status,
        createdAt: page.created_at
      },
      html: {
        exists: !!htmlContent,
        length: htmlContent.length,
        isEmpty: htmlContent.length === 0,
        preview: htmlContent.substring(0, 500),
        hasDoctype: htmlContent.includes('<!DOCTYPE'),
        hasHtmlTag: htmlContent.includes('<html'),
        hasBody: htmlContent.includes('<body'),
        variables: {
          hasStudentName: htmlContent.includes('{{studentName}}'),
          hasPeriod: htmlContent.includes('{{period}}'),
          hasAcademyName: htmlContent.includes('{{academyName}}')
        }
      },
      url: `/lp/${slug}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ Debug error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
