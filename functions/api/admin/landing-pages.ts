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
    const userId = user.id; // User.id는 TEXT 타입 (예: "admin-001")

    // userId를 INTEGER 해시로 변환 (landing_pages.user_id가 INTEGER이므로)
    function hashStringToInt(str: string): number {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash);
    }
    
    const userIdForQuery = hashStringToInt(String(userId));
    console.log('✅ User verified:', { email: user.email, role, academyId: userAcademyId, userIdHash: userIdForQuery, originalUserId: userId });

    // 역할별 쿼리 생성 - 두 스키마 모두 지원
    let query = '';
    let queryParams: any[] = [];

    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      // 관리자는 모든 랜딩페이지 조회
      // 새 스키마(createdById)와 구 스키마(user_id) 모두 지원
      query = `
        SELECT 
          lp.id, lp.slug, lp.title, 
          COALESCE(lp.createdAt, lp.created_at) as createdAt,
          COALESCE(lp.createdById, CAST(lp.user_id AS TEXT)) as createdById,
          u.name as creatorName,
          COALESCE(lp.views, lp.view_count, 0) as viewCount,
          COALESCE(lp.isActive, CASE WHEN lp.status = 'active' THEN 1 ELSE 0 END, 1) as isActive
        FROM landing_pages lp
        LEFT JOIN User u ON (lp.createdById = u.id OR CAST(lp.user_id AS TEXT) = u.id)
        ORDER BY COALESCE(lp.createdAt, lp.created_at) DESC
      `;
    } else if (role === 'DIRECTOR' || role === 'TEACHER') {
      // 학원장/교사는 자신이 만든 것만 조회
      // 새 스키마와 구 스키마 모두 확인
      const userIdHash = hashStringToInt(String(userId));
      query = `
        SELECT 
          lp.id, lp.slug, lp.title,
          COALESCE(lp.createdAt, lp.created_at) as createdAt,
          COALESCE(lp.createdById, CAST(lp.user_id AS TEXT)) as createdById,
          u.name as creatorName,
          COALESCE(lp.views, lp.view_count, 0) as viewCount,
          COALESCE(lp.isActive, CASE WHEN lp.status = 'active' THEN 1 ELSE 0 END, 1) as isActive
        FROM landing_pages lp
        LEFT JOIN User u ON (lp.createdById = u.id OR CAST(lp.user_id AS TEXT) = u.id)
        WHERE lp.createdById = ? OR lp.user_id = ?
        ORDER BY COALESCE(lp.createdAt, lp.created_at) DESC
      `;
      queryParams = [userId, userIdHash]; // TEXT ID와 해시 모두 검색
    } else {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log('🔍 Executing query with params:', queryParams);
    console.log('🔍 Query:', query);
    
    const landingPages = await db.prepare(query).bind(...queryParams).all();

    console.log('📊 Found landing pages:', landingPages.results?.length || 0);
    
    // 디버깅: 첫 번째 결과 로깅
    if (landingPages.results && landingPages.results.length > 0) {
      console.log('📊 First result sample:', {
        id: landingPages.results[0].id,
        slug: landingPages.results[0].slug,
        title: landingPages.results[0].title,
        createdById: landingPages.results[0].createdById,
        creatorName: landingPages.results[0].creatorName
      });
    }

    // Parse results
    const results = (landingPages.results || []).map((lp: any) => ({
      id: lp.id,
      slug: lp.slug,
      title: lp.title,
      url: `/lp/${lp.slug}`,
      isActive: lp.isActive === 1,
      showQrCode: true,
      viewCount: lp.viewCount || 0,
      submissions: 0,
      createdAt: lp.createdAt,
      creatorName: lp.creatorName
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

    const creatorUserId = user.id; // 생성자 ID (User.id는 TEXT!)
    console.log('✅ Creator 정보:', { 
      id: creatorUserId, 
      email: user.email, 
      role: user.role, 
      academyId: user.academyId,
      idType: typeof creatorUserId 
    });

    // ⚠️ landing_pages.user_id가 INTEGER인 경우: TEXT ID를 숫자 해시로 변환
    // User.id (TEXT)를 간단한 해시 함수로 INTEGER로 변환
    function hashStringToInt(str: string): number {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    }
    
    const userIdForDb = hashStringToInt(String(creatorUserId));
    console.log('✅ user_id for DB (INTEGER hash):', userIdForDb, 'from:', creatorUserId);
    
    // content_json에 실제 User.id를 저장 (추적용)
    const userIdOriginal = String(creatorUserId);

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
      studentId: userIdStr,  // JSON 안에 저장
      creatorUserId: userIdOriginal // 실제 User.id 저장 (추적용)
    });

    // HTML 콘텐츠 생성
    let htmlContent = '';
    
    if (templateHtml) {
      // 템플릿 HTML이 제공된 경우
      console.log('✅ Using provided template HTML, length:', templateHtml.length);
      htmlContent = templateHtml;
      
      // 기본 변수 치환
      htmlContent = htmlContent.replace(/\{\{title\}\}/g, title);
      htmlContent = htmlContent.replace(/\{\{subtitle\}\}/g, subtitle || '');
      htmlContent = htmlContent.replace(/\{\{description\}\}/g, description || '');
      
      // 학생 정보 변수 치환 (기본값 설정)
      htmlContent = htmlContent.replace(/\{\{studentName\}\}/g, '학생');
      htmlContent = htmlContent.replace(/\{\{period\}\}/g, '2024년 1학기');
      htmlContent = htmlContent.replace(/\{\{attendanceRate\}\}/g, '95%');
      htmlContent = htmlContent.replace(/\{\{totalDays\}\}/g, '40');
      htmlContent = htmlContent.replace(/\{\{presentDays\}\}/g, '38');
      htmlContent = htmlContent.replace(/\{\{tardyDays\}\}/g, '1');
      htmlContent = htmlContent.replace(/\{\{absentDays\}\}/g, '1');
      htmlContent = htmlContent.replace(/\{\{homeworkRate\}\}/g, '90%');
      htmlContent = htmlContent.replace(/\{\{homeworkCompleted\}\}/g, '36');
      htmlContent = htmlContent.replace(/\{\{aiChatCount\}\}/g, '127');
      htmlContent = htmlContent.replace(/\{\{academyName\}\}/g, '슈퍼플레이스 스터디');
      htmlContent = htmlContent.replace(/\{\{directorName\}\}/g, '홍길동');
      
      console.log('✅ Template HTML processed, length:', htmlContent.length);
    } else {
      // 기본 HTML 생성
      console.log('⚠️ Using default HTML');
      htmlContent = `
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
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; }
    .subtitle { color: #666; font-size: 1.2em; margin: 10px 0; }
    .description { color: #444; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
    ${description ? `<div class="description">${description}</div>` : ''}
  </div>
</body>
</html>`;
    }

    // Insert landing page - 실제 존재하는 컬럼만 사용
    console.log("📝 랜딩페이지 생성 시작");
    console.log("📝 데이터:", { 
      id, 
      slug, 
      title, 
      createdById: userIdOriginal,
      templateType 
    });
    
    let insertResult: any = null;
    
    try {
      // 먼저 간단한 INSERT 시도 (최소 필수 컬럼만)
      console.log("📝 INSERT 실행 - createdById:", userIdOriginal);
      insertResult = await db
        .prepare(`
          INSERT INTO landing_pages 
          (id, slug, title, createdById) 
          VALUES (?, ?, ?, ?)
        `)
        .bind(id, slug, title, userIdOriginal)
        .run();
      
      console.log("✅ 기본 INSERT 성공");
      console.log("✅ insertResult:", JSON.stringify(insertResult));
      
      // 이제 선택적 컬럼 업데이트 (존재하는 컬럼만)
      const updates: string[] = [];
      const updateValues: any[] = [];
      
      if (subtitle) {
        updates.push('subtitle = ?');
        updateValues.push(subtitle);
      }
      
      if (description) {
        updates.push('description = ?');
        updateValues.push(description);
      }
      
      if (templateType) {
        updates.push('templateType = ?');
        updateValues.push(templateType);
      }
      
      if (htmlContent) {
        updates.push('templateHtml = ?');
        updateValues.push(htmlContent);
      }
      
      if (inputData && inputData.length > 0) {
        updates.push('customFields = ?');
        updateValues.push(JSON.stringify(inputData));
      }
      
      if (thumbnail) {
        updates.push('thumbnailUrl = ?');
        updateValues.push(thumbnail);
      }
      
      if (qrCodeUrl) {
        updates.push('qrCodeUrl = ?');
        updateValues.push(qrCodeUrl);
      }
      
      if (ogTitle) {
        updates.push('metaTitle = ?');
        updateValues.push(ogTitle);
      }
      
      if (ogDescription) {
        updates.push('metaDescription = ?');
        updateValues.push(ogDescription);
      }
      
      // 업데이트할 내용이 있으면 실행
      if (updates.length > 0) {
        updateValues.push(id);
        const updateQuery = `UPDATE landing_pages SET ${updates.join(', ')} WHERE id = ?`;
        await db.prepare(updateQuery).bind(...updateValues).run();
        console.log("✅ Optional fields updated");
      }
    } catch (error: any) {
      console.error("❌ Insert failed:", error.message);
      
      // 구 스키마로 재시도
      console.log("🔄 Trying legacy schema...");
      try {
        insertResult = await db
          .prepare(`
            INSERT INTO landing_pages 
            (slug, title, user_id, template_type, content_json, html_content) 
            VALUES (?, ?, ?, ?, ?, ?)
          `)
          .bind(
            slug,
            title,
            hashStringToInt(userIdOriginal),
            templateType || 'basic',
            JSON.stringify(inputData || []),
            htmlContent
          )
          .run();
        console.log("✅ Legacy insert successful");
      } catch (legacyError: any) {
        console.error("❌ Legacy insert also failed:", legacyError.message);
        throw new Error(`Failed to insert landing page: ${error.message}`);
      }
    }

    console.log("✅ Landing page inserted successfully");
    if (insertResult) {
      console.log("📊 Insert result:", JSON.stringify(insertResult));
    }

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
        .prepare(`SELECT id, slug, title, created_at FROM landing_pages ORDER BY id DESC LIMIT 5`)
        .all();
      console.log("📊 Recent rows:", JSON.stringify(recentRows.results));
      
      // Try selecting by id (last inserted)
      const lastId = insertResult.meta?.last_row_id;
      if (lastId) {
        console.log("🔍 Trying to select by ID:", lastId);
        const resultById = await db
          .prepare(`SELECT id, slug, title FROM landing_pages WHERE id = ?`)
          .bind(lastId)
          .first();
        console.log("📊 Result by ID:", JSON.stringify(resultById));
        
        if (resultById) {
          // Use this result instead
          return new Response(
            JSON.stringify({
              success: true,
              message: "랜딩페이지가 생성되었습니다.",
              landingPage: {
                id: resultById.id,
                slug: resultById.slug,
                url: `/lp/${resultById.slug}`,
                qrCodeUrl,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }
      
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
