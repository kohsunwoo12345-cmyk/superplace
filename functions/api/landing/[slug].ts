interface Env {
  DB: D1Database;
}

// GET: slug로 랜딩페이지 HTML 반환

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const slug = pathSegments[pathSegments.length - 1]; // 마지막 세그먼트가 slug

    if (!DB) {
      return new Response("Database not configured", {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (!slug) {
      return new Response("Landing page not found", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 랜딩페이지 조회
    const landingPage = await DB.prepare(`
      SELECT * FROM landing_pages WHERE slug = ? AND is_active = 1
    `).bind(slug).first();

    if (!landingPage) {
      return new Response("Landing page not found or inactive", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 조회수 증가
    await DB.prepare(`
      UPDATE landing_pages SET view_count = view_count + 1 WHERE id = ?
    `).bind(landingPage.id).run();

    // HTML 템플릿 렌더링
    let html = (landingPage.html_template as string) || '';

    // 변수 치환
    const replacements: Record<string, string> = {
      '{{title}}': (landingPage.title as string) || '',
      '{{subtitle}}': (landingPage.subtitle as string) || '',
      '{{landing_page_id}}': String(landingPage.id),
      '{{meta_pixel}}': '',
      '{{custom_script}}': ''
    };

    // 메타 픽셀 추가
    if (landingPage.meta_pixel_id) {
      replacements['{{meta_pixel}}'] = `
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${landingPage.meta_pixel_id}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${landingPage.meta_pixel_id}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
      `.trim();
    }

    // 커스텀 스크립트 추가
    if (landingPage.custom_script) {
      replacements['{{custom_script}}'] = landingPage.custom_script as string;
    }

    // 모든 변수 치환
    for (const [key, value] of Object.entries(replacements)) {
      html = html.replace(new RegExp(key, 'g'), value);
    }

    return new Response(html, {
      status: 200,
      headers: { 
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300"
      },
    });
  } catch (error: any) {
    console.error("Landing page view error:", error);
    return new Response(`Error loading landing page: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
};
