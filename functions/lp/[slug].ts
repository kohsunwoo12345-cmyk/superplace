// Cloudflare Pages Function - 랜딩페이지 렌더링
interface Env {
  DB: D1Database;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { slug: string };
}) {
  try {
    const { slug } = context.params;
    const db = context.env.DB;

    console.log("🔍 랜딩페이지 조회:", slug);

    // 구 스키마로 직접 조회
    const landingPage = await db
      .prepare(`SELECT * FROM landing_pages WHERE slug = ? LIMIT 1`)
      .bind(slug)
      .first();
    
    console.log("✅ 조회 결과:", landingPage ? "데이터 있음" : "데이터 없음");
    
    if (landingPage) {
      console.log("📊 데이터 샘플:", {
        id: landingPage.id,
        slug: landingPage.slug,
        title: landingPage.title,
        hasHtmlContent: !!landingPage.html_content,
        htmlLength: landingPage.html_content?.length || 0
      });
    }

    if (!landingPage) {
      console.log("❌ 랜딩페이지를 찾을 수 없음:", slug);
      return new Response(
        `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>페이지를 찾을 수 없습니다</title>
  <style>
    body { font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f9fafb; margin: 0; }
    .container { text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #ef4444; font-size: 32px; margin-bottom: 16px; }
    p { color: #6b7280; margin-bottom: 24px; }
    a { display: inline-block; padding: 12px 32px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚠️ 페이지를 찾을 수 없습니다</h1>
    <p>요청하신 페이지가 존재하지 않거나 삭제되었습니다.</p>
    <p style="font-size: 12px; color: #999;">Slug: ${slug}</p>
    <a href="/">홈으로 돌아가기</a>
  </div>
</body>
</html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    // 조회수 증가
    try {
      await db
        .prepare(`UPDATE landing_pages SET view_count = view_count + 1 WHERE slug = ?`)
        .bind(slug)
        .run();
    } catch (e: any) {
      console.log("⚠️ 조회수 업데이트 실패:", e.message);
    }

    // HTML 콘텐츠 반환
    const htmlContent = landingPage.html_content || '';
    
    console.log("✅ HTML 콘텐츠 반환, 길이:", htmlContent.length);
    
    return new Response(htmlContent, {
      status: 200,
      headers: { 
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300"
      },
    });
  } catch (error: any) {
    console.error("❌ 렌더링 오류:", error);
    return new Response(
      `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>오류 발생</title>
</head>
<body>
  <h1>오류가 발생했습니다</h1>
  <pre>${error.message}</pre>
  <pre>${error.stack}</pre>
</body>
</html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
