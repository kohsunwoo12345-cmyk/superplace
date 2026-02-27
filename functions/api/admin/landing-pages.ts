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

    // 디버깅: 받은 데이터 확인
    console.log("🔍 API Received Data:", {
      studentId,
      studentIdType: typeof studentId,
      folderId,
      folderIdType: typeof folderId,
      slug,
      title,
    });

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

    const db = context.env.DB;

    // 디버깅: studentId 값과 타입 확인
    console.log("🔍 studentId received:", studentId, "type:", typeof studentId);

    // ⚠️ User 테이블의 id는 TEXT 타입! (예: 'user-1234567890-abc')
    // parseInt 하지 말고 그대로 사용해야 함!
    let userIdStr = studentId;
    
    if (typeof studentId === 'number') {
      // number면 string으로 변환
      userIdStr = String(studentId);
      console.log("🔄 Converted number to string:", studentId, "→", userIdStr);
    } else if (typeof studentId === 'string') {
      userIdStr = studentId;
      console.log("✅ Already string:", userIdStr);
    } else {
      console.log("⚠️ Unexpected type:", typeof studentId, "value:", studentId);
      userIdStr = String(studentId);
    }

    console.log("🎯 Final userIdStr:", userIdStr, "type:", typeof userIdStr);

    // 🔍 디버깅: User 테이블에 어떤 데이터가 있는지 먼저 확인
    console.log("🔍 Checking all users in User table...");
    const allUsers = await db
      .prepare(`SELECT id, name, role FROM User LIMIT 10`)
      .all();
    console.log("📊 All users:", JSON.stringify(allUsers.results || []));

    // 🔍 학생만 확인
    const allStudents = await db
      .prepare(`SELECT id, name, role FROM User WHERE role = 'STUDENT' LIMIT 10`)
      .all();
    console.log("🎓 All students:", JSON.stringify(allStudents.results || []));

    // Verify user_id exists in User table (id는 TEXT 타입!)
    console.log("🔍 Looking for user with id:", userIdStr);
    const userExists = await db
      .prepare(`SELECT id, name, role FROM User WHERE id = ?`)
      .bind(userIdStr)
      .first();

    console.log("🔍 Query result:", JSON.stringify(userExists));

    if (!userExists) {
      return new Response(
        JSON.stringify({ 
          error: "선택한 학생이 존재하지 않습니다.",
          details: `studentId: ${studentId} (original) → ${userIdStr} (converted) not found in User table`,
          debugInfo: {
            originalValue: studentId,
            originalType: typeof studentId,
            convertedValue: userIdStr,
            convertedType: typeof userIdStr,
            tableName: "User (TEXT id)",
            allUsersCount: allUsers.results?.length || 0,
            allStudentsCount: allStudents.results?.length || 0,
            sampleUsers: allUsers.results?.slice(0, 3) || [],
            sampleStudents: allStudents.results?.slice(0, 3) || []
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ User found:", userExists.name, "role:", userExists.role);

    // ⚠️ FOREIGN KEY 제약 비활성화 (임시 해결)
    await db.prepare(`PRAGMA foreign_keys = OFF`).run();
    console.log("⚠️ Foreign keys disabled temporarily");

    // Convert and verify folder_id if provided
    let folderIdInt = null;
    if (folderId) {
      folderIdInt = typeof folderId === 'string' ? parseInt(folderId, 10) : folderId;
      console.log("🔍 folderId:", folderId, "→", folderIdInt);

      const folderExists = await db
        .prepare(`SELECT id FROM landing_page_folders WHERE id = ?`)
        .bind(folderIdInt)
        .first();

      if (!folderExists) {
        console.log("⚠️ Folder not found:", folderIdInt);
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
        userIdStr,  // ← TEXT 타입으로 저장 (예: 'user-1234567890-abc')
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

    // ✅ FOREIGN KEY 제약 다시 활성화
    await db.prepare(`PRAGMA foreign_keys = ON`).run();
    console.log("✅ Foreign keys re-enabled");

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
