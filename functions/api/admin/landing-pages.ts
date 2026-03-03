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

    // 역할별 쿼리 생성 - 구 스키마 사용
    let query = '';
    let queryParams: any[] = [];

    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      // 관리자는 모든 랜딩페이지 조회
      query = `
        SELECT 
          lp.id, lp.slug, lp.title, lp.created_at as createdAt,
          lp.user_id as createdById,
          u.name as creatorName,
          lp.view_count as viewCount,
          CASE WHEN lp.status = 'active' THEN 1 ELSE 0 END as isActive
        FROM landing_pages lp
        LEFT JOIN User u ON CAST(lp.user_id AS TEXT) = u.id
        ORDER BY lp.created_at DESC
      `;
    } else if (role === 'DIRECTOR' || role === 'TEACHER') {
      // 학원장/교사는 자신이 만든 것만 조회
      // user_id는 INTEGER이므로 해시값으로 비교
      const userIdHash = hashStringToInt(String(userId));
      query = `
        SELECT 
          lp.id, lp.slug, lp.title, lp.created_at as createdAt,
          lp.user_id as createdById,
          u.name as creatorName,
          lp.view_count as viewCount,
          CASE WHEN lp.status = 'active' THEN 1 ELSE 0 END as isActive
        FROM landing_pages lp
        LEFT JOIN User u ON CAST(lp.user_id AS TEXT) = u.id
        WHERE lp.user_id = ?
        ORDER BY lp.created_at DESC
      `;
      queryParams = [userIdHash];
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
    const creatorRole = user.role ? user.role.toUpperCase() : '';
    const creatorAcademyId = user.academyId;
    
    console.log('✅ Creator 정보:', { 
      id: creatorUserId, 
      email: user.email, 
      role: creatorRole, 
      academyId: creatorAcademyId,
      idType: typeof creatorUserId 
    });

    // 🔒 구독 체크 (DIRECTOR/TEACHER만)
    if (creatorRole === 'DIRECTOR' || creatorRole === 'TEACHER') {
      // DIRECTOR의 활성 구독 확인
      let checkUserId = creatorUserId;
      
      // TEACHER인 경우 해당 학원의 DIRECTOR 찾기
      if (creatorRole === 'TEACHER' && creatorAcademyId) {
        const director = await db.prepare(`
          SELECT id FROM User 
          WHERE academyId = ? AND role = 'DIRECTOR'
          LIMIT 1
        `).bind(creatorAcademyId).first();
        
        if (director) {
          checkUserId = director.id;
        }
      }
      
      const subscription = await db.prepare(`
        SELECT * FROM user_subscriptions 
        WHERE userId = ? AND status = 'active'
        ORDER BY createdAt DESC
        LIMIT 1
      `).bind(checkUserId).first();

      if (!subscription) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "SUBSCRIPTION_REQUIRED",
            message: "랜딩페이지 생성을 위해 요금제 구독이 필요합니다."
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      // 만료 확인
      const now = new Date();
      const endDate = new Date(subscription.endDate as string);
      if (now > endDate) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "SUBSCRIPTION_EXPIRED",
            message: "구독이 만료되었습니다. 갱신이 필요합니다."
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      // 랜딩페이지 한도 체크
      const maxLandingPages = subscription.limit_maxLandingPages as number;
      const currentLandingPages = subscription.usage_landingPages as number;

      if (maxLandingPages !== -1 && currentLandingPages >= maxLandingPages) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "LANDING_PAGE_LIMIT_EXCEEDED",
            message: `랜딩페이지 생성 한도를 초과했습니다. (${currentLandingPages}/${maxLandingPages})`,
            currentUsage: currentLandingPages,
            maxLimit: maxLandingPages
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

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
      startDate,
      endDate,
    } = body;

    // 디버깅: 받은 데이터 확인
    console.log("🔍 API Received Data:", {
      studentId,
      studentIdType: typeof studentId,
      folderId,
      folderIdType: typeof folderId,
      slug,
      title,
      templateType,
      templateHtmlLength: templateHtml ? templateHtml.length : 0,
      hasTemplateHtml: !!templateHtml,
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
      
      // ============================================
      // 실제 데이터 조회 및 변수 치환
      // ============================================
      
      // 1️⃣ 학생 정보 조회
      let studentName = '학생';
      let studentInfo = null;
      
      if (userIdStr) {
        try {
          studentInfo = await db.prepare(`
            SELECT name, email 
            FROM User 
            WHERE id = ?
          `).bind(userIdStr).first();
          
          if (studentInfo && studentInfo.name) {
            studentName = studentInfo.name;
            console.log('✅ 학생 정보 조회 성공:', studentName);
          } else {
            console.log('⚠️ 학생 정보를 찾을 수 없습니다. 기본값 사용.');
          }
        } catch (err) {
          console.error('❌ 학생 정보 조회 실패:', err);
        }
      }
      
      // 2️⃣ 학원 및 원장 정보 조회
      let academyName = '학원';
      let directorName = '원장';
      
      if (creatorAcademyId) {
        try {
          const academyInfo = await db.prepare(`
            SELECT a.name as academyName, u.name as directorName
            FROM Academy a
            LEFT JOIN User u ON a.id = u.academyId AND u.role = 'DIRECTOR'
            WHERE a.id = ?
            LIMIT 1
          `).bind(creatorAcademyId).first();
          
          if (academyInfo) {
            academyName = academyInfo.academyName || academyName;
            directorName = academyInfo.directorName || directorName;
            console.log('✅ 학원 정보 조회 성공:', academyName, '-', directorName);
          }
        } catch (err) {
          console.error('❌ 학원 정보 조회 실패:', err);
        }
      }
      
      // 3️⃣ 출석 데이터 조회 및 계산
      let attendanceRate = '0%';
      let totalDays = '0';
      let presentDays = '0';
      let tardyDays = '0';
      let absentDays = '0';
      
      if (userIdStr && startDate && endDate) {
        try {
          const attendanceData = await db.prepare(`
            SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
              SUM(CASE WHEN status = 'TARDY' THEN 1 ELSE 0 END) as tardy,
              SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent
            FROM Attendance 
            WHERE userId = ? AND date BETWEEN ? AND ?
          `).bind(userIdStr, startDate, endDate).first();
          
          if (attendanceData && attendanceData.total > 0) {
            const total = Number(attendanceData.total);
            const present = Number(attendanceData.present || 0);
            const tardy = Number(attendanceData.tardy || 0);
            const absent = Number(attendanceData.absent || 0);
            
            const rate = total > 0 ? Math.round((present / total) * 100) : 0;
            
            totalDays = String(total);
            presentDays = String(present);
            tardyDays = String(tardy);
            absentDays = String(absent);
            attendanceRate = `${rate}%`;
            
            console.log('✅ 출석 데이터 조회 성공:', { total, present, tardy, absent, rate });
          } else {
            console.log('⚠️ 출석 데이터가 없습니다. 기본값 사용.');
          }
        } catch (err) {
          console.error('❌ 출석 데이터 조회 실패:', err);
        }
      }
      
      // 4️⃣ 숙제 데이터 조회 및 계산
      let homeworkRate = '0%';
      let homeworkCompleted = '0';
      
      if (userIdStr) {
        try {
          const homeworkData = await db.prepare(`
            SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
            FROM HomeworkSubmission 
            WHERE studentId = ?
          `).bind(userIdStr).first();
          
          if (homeworkData && homeworkData.total > 0) {
            const total = Number(homeworkData.total);
            const completed = Number(homeworkData.completed || 0);
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            homeworkCompleted = String(completed);
            homeworkRate = `${rate}%`;
            
            console.log('✅ 숙제 데이터 조회 성공:', { total, completed, rate });
          } else {
            console.log('⚠️ 숙제 데이터가 없습니다. 기본값 사용.');
          }
        } catch (err) {
          console.error('❌ 숙제 데이터 조회 실패:', err);
        }
      }
      
      // 5️⃣ AI 대화 데이터 조회
      let aiChatCount = '0';
      
      if (userIdStr) {
        try {
          const aiChatData = await db.prepare(`
            SELECT COUNT(*) as count
            FROM ChatSession 
            WHERE userId = ?
          `).bind(userIdStr).first();
          
          if (aiChatData) {
            aiChatCount = String(aiChatData.count || 0);
            console.log('✅ AI 대화 데이터 조회 성공:', aiChatCount);
          }
        } catch (err) {
          console.error('❌ AI 대화 데이터 조회 실패:', err);
        }
      }
      
      // 6️⃣ 기간 표시
      let period = '학습 기간';
      
      if (startDate && endDate) {
        try {
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          const startYear = start.getFullYear();
          const startMonth = start.getMonth() + 1;
          const endMonth = end.getMonth() + 1;
          
          if (startYear === end.getFullYear()) {
            period = `${startYear}년 ${startMonth}월 ~ ${endMonth}월`;
          } else {
            period = `${startYear}년 ${startMonth}월 ~ ${end.getFullYear()}년 ${endMonth}월`;
          }
          
          console.log('✅ 기간 설정:', period);
        } catch (err) {
          console.error('❌ 기간 설정 실패:', err);
        }
      }
      
      // 변수 치환
      htmlContent = htmlContent.replace(/\{\{studentName\}\}/g, studentName);
      htmlContent = htmlContent.replace(/\{\{period\}\}/g, period);
      htmlContent = htmlContent.replace(/\{\{attendanceRate\}\}/g, attendanceRate);
      htmlContent = htmlContent.replace(/\{\{totalDays\}\}/g, totalDays);
      htmlContent = htmlContent.replace(/\{\{presentDays\}\}/g, presentDays);
      htmlContent = htmlContent.replace(/\{\{tardyDays\}\}/g, tardyDays);
      htmlContent = htmlContent.replace(/\{\{absentDays\}\}/g, absentDays);
      htmlContent = htmlContent.replace(/\{\{homeworkRate\}\}/g, homeworkRate);
      htmlContent = htmlContent.replace(/\{\{homeworkCompleted\}\}/g, homeworkCompleted);
      htmlContent = htmlContent.replace(/\{\{aiChatCount\}\}/g, aiChatCount);
      htmlContent = htmlContent.replace(/\{\{academyName\}\}/g, academyName);
      htmlContent = htmlContent.replace(/\{\{directorName\}\}/g, directorName);
      
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
    let insertedId = id;
    
    try {
      // 한 번에 모든 데이터 INSERT (신 스키마)
      console.log("📝 INSERT 실행 - createdById:", userIdOriginal);
      insertResult = await db
        .prepare(`
          INSERT INTO landing_pages 
          (id, slug, title, subtitle, description, templateType, templateHtml, 
           customFields, thumbnailUrl, qrCodeUrl, metaTitle, metaDescription, 
           isActive, createdById) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `)
        .bind(
          id, 
          slug, 
          title, 
          subtitle || null,
          description || null,
          templateType || 'basic',
          htmlContent || null,
          (inputData && inputData.length > 0) ? JSON.stringify(inputData) : null,
          thumbnail || null,
          qrCodeUrl || null,
          ogTitle || title,
          ogDescription || description || null,
          userIdOriginal
        )
        .run();
      
      console.log("✅ 신규 스키마 INSERT 성공");
      console.log("✅ insertResult:", JSON.stringify(insertResult));
      
    } catch (error: any) {
      console.error("❌ 신규 스키마 INSERT 실패:", error.message);
      console.error("❌ 에러 상세:", error.stack);
      
      // 구 스키마로 재시도 (id 제거, AUTO INCREMENT)
      console.log("🔄 구 스키마로 재시도...");
      try {
        insertResult = await db
          .prepare(`
            INSERT INTO landing_pages 
            (slug, title, user_id, template_type, content_json, html_content, 
             qr_code_url, thumbnail_url, og_title, og_description, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
          `)
          .bind(
            slug,
            title,
            hashStringToInt(userIdOriginal),
            templateType || 'basic',
            JSON.stringify(inputData || []),
            htmlContent || '',
            qrCodeUrl || null,
            thumbnail || null,
            ogTitle || title,
            ogDescription || description || null
          )
          .run();
        console.log("✅ 구 스키마 INSERT 성공");
      } catch (legacyError: any) {
        console.error("❌ 구 스키마 INSERT도 실패:", legacyError.message);
        console.error("❌ 구 스키마 에러 상세:", legacyError.stack);
        throw new Error(`랜딩페이지 생성 실패: ${error.message}. 구 스키마 실패: ${legacyError.message}`);
      }
    }

    console.log("✅ 랜딩페이지 INSERT 완료");
    if (insertResult) {
      console.log("📊 INSERT 결과:", JSON.stringify(insertResult));
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
    
    // 조회 성공 시 ID 업데이트
    insertedId = result.id;

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
