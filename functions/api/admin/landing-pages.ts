// Cloudflare Pages Function
interface Env {
  DB: D1Database;
}

// 토큰 파싱 함수
function parseToken(authHeader: string | null): { id: string; email: string; role: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('|');
  
  if (parts.length < 3) {
    return null;
  }
  
  return {
    id: parts[0],
    email: parts[1],
    role: parts[2]
  };
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

    const tokenData = parseToken(authHeader);
    if (!tokenData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;

    // 사용자 정보 조회
    const user = await db
      .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const role = user.role ? user.role.toUpperCase() : '';
    const userAcademyId = user.academyId;
    const userId = user.id;

    // userId 타입 변환 (landing_pages.user_id에 맞춤)
    let userIdForQuery: any = userId;
    if (typeof userId === 'string' && /^\d+$/.test(userId)) {
      userIdForQuery = parseInt(userId, 10);
      console.log('🔄 Converted userId to INTEGER for query:', userIdForQuery);
    }

    console.log('✅ User verified:', { email: user.email, role, academyId: userAcademyId, userId, userIdForQuery });

    // 역할별 쿼리 생성
    let query = '';
    let queryParams: any[] = [];

    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      // 관리자는 모든 랜딩페이지 조회
      query = `
        SELECT 
          lp.id, lp.slug, lp.title, lp.created_at, lp.user_id,
          u.name as creatorName
        FROM landing_pages lp
        LEFT JOIN User u ON lp.user_id = u.id
        ORDER BY lp.id DESC
      `;
    } else if (role === 'DIRECTOR' || role === 'TEACHER') {
      // 학원장/교사는 자신이 만든 것만 조회
      query = `
        SELECT 
          lp.id, lp.slug, lp.title, lp.created_at, lp.user_id,
          u.name as creatorName
        FROM landing_pages lp
        LEFT JOIN User u ON lp.user_id = u.id
        WHERE lp.user_id = ?
        ORDER BY lp.id DESC
      `;
      queryParams = [userIdForQuery];
    } else {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const landingPages = await db.prepare(query).bind(...queryParams).all();

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

    // 토큰 파싱
    const tokenData = parseToken(authHeader);
    if (!tokenData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;

    // 사용자 정보 조회
    const user = await db
      .prepare('SELECT id, email, role, academyId FROM User WHERE email = ?')
      .bind(tokenData.email)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const creatorUserId = user.id; // 생성자 ID (TEXT 또는 INTEGER)
    console.log('✅ Creator:', { id: creatorUserId, email: user.email, role: user.role, idType: typeof creatorUserId });

    // user_id 타입 변환: landing_pages.user_id가 INTEGER이면 숫자로, TEXT이면 그대로
    let userIdForDb: any = creatorUserId;
    
    // creatorUserId가 숫자 형태의 문자열이면 INTEGER로 변환 시도
    if (typeof creatorUserId === 'string' && /^\d+$/.test(creatorUserId)) {
      userIdForDb = parseInt(creatorUserId, 10);
      console.log('🔄 Converted user_id to INTEGER:', userIdForDb);
    } else if (typeof creatorUserId === 'number') {
      userIdForDb = creatorUserId;
      console.log('✅ user_id is already INTEGER:', userIdForDb);
    } else {
      // TEXT 형태 (예: 'user-123-abc')는 그대로 사용
      console.log('✅ user_id is TEXT:', userIdForDb);
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

    // ⚠️ User 존재 확인 건너뛰기 - 바로 INSERT
    console.log("⚠️ Skipping user existence check - direct insert");

    // Convert folder_id (검증 없이)
    let folderIdInt = null;
    if (folderId) {
      folderIdInt = typeof folderId === 'string' ? parseInt(folderId, 10) : folderId;
      console.log("🔍 folderId:", folderId, "→", folderIdInt, "(no validation)");
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
      sections: [],
      studentId: userIdStr  // JSON 안에 저장
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
  <meta name="student-id" content="${userIdStr}">
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
    ${description ? `<div class="description">${description}</div>` : ''}
  </div>
</body>
</html>`;

    // Insert landing page - 생성자의 실제 user.id 사용 (FK 제약 충족)
    console.log("📝 Inserting landing page with user_id:", userIdForDb, "type:", typeof userIdForDb);
    console.log("📝 Creator info:", { creatorUserId, userIdForDb, slug, title });
    
    const insertResult = await db
      .prepare(`INSERT INTO landing_pages (slug, title, user_id, template_type, content_json, html_content) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(slug, title, userIdForDb, templateType || 'basic', defaultContentJson, defaultHtmlContent)
      .run();

    console.log("✅ Landing page inserted successfully");
    console.log("📊 Insert result:", JSON.stringify(insertResult));

    // Wait a tiny bit for consistency
    await new Promise(resolve => setTimeout(resolve, 100));

    // 생성된 ID 가져오기 - 반드시 성공해야 함!
    console.log("🔍 Querying for inserted row...");
    const result = await db
      .prepare(`SELECT id, slug, title FROM landing_pages WHERE slug = ? LIMIT 1`)
      .bind(slug)
      .first();
    
    console.log("📊 Select result:", JSON.stringify(result));
    
    if (!result) {
      // Try to list recent rows
      console.log("⚠️ Row not found! Listing recent entries...");
      const recentRows = await db
        .prepare(`SELECT id, slug, title, createdAt FROM landing_pages ORDER BY createdAt DESC LIMIT 5`)
        .all();
      console.log("📊 Recent rows:", JSON.stringify(recentRows.results));
      
      throw new Error(`INSERT succeeded but cannot find row with slug: ${slug}. Recent rows: ${recentRows.results?.length || 0}`);
    }
    
    const insertedId = result.id;

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
    console.error("❌❌❌ 랜딩페이지 생성 오류:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    // 실제 오류를 반환!
    return new Response(
      JSON.stringify({
        error: error.message || "랜딩페이지 생성 중 오류가 발생했습니다.",
        details: error.stack,
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
