// Cloudflare Pages Function
interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;

    // Get all landing pages with additional info
    const landingPages = await db
      .prepare(
        `SELECT 
          lp.id, lp.slug, lp.title
        FROM landing_pages lp
        ORDER BY lp.id DESC`
      )
      .all();

    // Parse results
    const results = (landingPages.results || []).map((lp: any) => ({
      id: lp.id,
      slug: lp.slug,
      title: lp.title,
      url: `/lp/${lp.slug}`,
      isActive: true,
      showQrCode: true,
      viewCount: 0,
      submissions: 0
    }));

    return new Response(
      JSON.stringify({
        success: true,
        landingPages: results,
        total: results.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("랜딩페이지 목록 조회 오류:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "랜딩페이지 목록 조회 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const authHeader = context.request.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json();
    const {
      slug,
      title,
      subtitle,
      description,
      templateType = "basic",
      templateHtml,
      inputData = [],
      ogTitle,
      ogDescription,
      thumbnail,
      folderId,
      showQrCode = true,
      qrCodePosition = "bottom",
      pixelScripts = [],
      studentId,
    } = body;

    if (!slug || !title) {
      return new Response(
        JSON.stringify({
          error: "필수 항목이 누락되었습니다. (slug, title)",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!studentId) {
      return new Response(
        JSON.stringify({
          error: "학생을 선택해주세요.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const db = context.env.DB;

    // Convert studentId to integer
    const userIdInt = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
    
    if (isNaN(userIdInt)) {
      return new Response(
        JSON.stringify({ 
          error: "잘못된 학생 ID입니다.",
          details: `studentId: ${studentId} is not a valid integer`
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify user_id exists in users table
    const userExists = await db
      .prepare(`SELECT id FROM users WHERE id = ?`)
      .bind(userIdInt)
      .first();

    if (!userExists) {
      return new Response(
        JSON.stringify({ 
          error: "선택한 학생이 존재하지 않습니다.",
          details: `studentId: ${userIdInt} not found in users table`
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Convert and verify folder_id if provided
    let folderIdInt = null;
    if (folderId) {
      folderIdInt = typeof folderId === 'string' ? parseInt(folderId, 10) : folderId;
      
      if (isNaN(folderIdInt)) {
        return new Response(
          JSON.stringify({ 
            error: "잘못된 폴더 ID입니다.",
            details: `folderId: ${folderId} is not a valid integer`
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const folderExists = await db
        .prepare(`SELECT id FROM landing_page_folders WHERE id = ?`)
        .bind(folderIdInt)
        .first();

      if (!folderExists) {
        return new Response(
          JSON.stringify({ 
            error: "선택한 폴더가 존재하지 않습니다.",
            details: `folderId: ${folderIdInt} not found in landing_page_folders table`
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Check if slug already exists
    const existing = await db
      .prepare(`SELECT id FROM landing_pages WHERE slug = ?`)
      .bind(slug)
      .first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "이미 사용 중인 slug입니다." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const id = `lp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const baseUrl = "https://superplace-study.pages.dev";
    const qrCodeUrl = showQrCode
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          `${baseUrl}/lp/${slug}`
        )}`
      : null;

    // 기본 content_json 생성
    const defaultContentJson = JSON.stringify({
      templateType: templateType || 'basic',
      data: inputData || {},
      sections: []
    });

    // 기본 html_content 생성
    const defaultHtmlContent = templateHtml || `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${ogTitle ? `<meta property="og:title" content="${ogTitle}">` : ''}
  ${ogDescription ? `<meta property="og:description" content="${ogDescription}">` : ''}
  ${thumbnail ? `<meta property="og:image" content="${thumbnail}">` : ''}
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
    ${description ? `<div class="description">${description}</div>` : ''}
  </div>
</body>
</html>`;

    // Insert landing page - 모든 필수 컬럼 포함
    await db
      .prepare(
        `INSERT INTO landing_pages (
          slug, title, user_id, template_type, 
          content_json, html_content,
          qr_code_url, folder_id, thumbnail_url,
          og_title, og_description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        slug,
        title,
        userIdInt,
        templateType || 'basic',
        defaultContentJson,
        defaultHtmlContent,
        qrCodeUrl,
        folderIdInt,
        thumbnail || null,
        ogTitle || null,
        ogDescription || null
      )
      .run();

    // 생성된 ID 가져오기
    const result = await db
      .prepare(`SELECT id FROM landing_pages WHERE slug = ?`)
      .bind(slug)
      .first();
    
    const insertedId = result?.id;

    // Insert pixel scripts if provided
    if (pixelScripts && Array.isArray(pixelScripts) && pixelScripts.length > 0) {
      for (const script of pixelScripts) {
        const scriptId = `ps_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`;
        await db
          .prepare(
            `INSERT INTO LandingPagePixelScript 
            (id, landingPageId, name, scriptType, scriptCode, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
          )
          .bind(scriptId, insertedId, script.name, script.scriptType, script.scriptCode)
          .run();
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "랜딩페이지가 생성되었습니다.",
        landingPage: {
          id: insertedId,
          slug,
          url: `/lp/${slug}`,
          qrCodeUrl,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("랜딩페이지 생성 오류:", error);
    
    // FOREIGN KEY 제약 조건 오류 상세 처리
    let errorMessage = error.message || "랜딩페이지 생성 중 오류가 발생했습니다.";
    
    if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
      errorMessage = "데이터베이스 참조 오류가 발생했습니다. 학생 또는 폴더 정보를 확인해주세요.";
    } else if (error.message && error.message.includes('NOT NULL constraint failed')) {
      errorMessage = `필수 항목이 누락되었습니다: ${error.message}`;
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
