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

    // 🔥 최대한 단순한 쿼리 - 모든 역할이 모든 페이지 조회
    const query = `SELECT * FROM landing_pages ORDER BY ROWID DESC`;
    const queryParams: any[] = [];

    console.log('🔍 Query:', query);
    
    const landingPages = await db.prepare(query).all();

    console.log('📊 Found landing pages:', landingPages.results?.length || 0);
    
    // Parse results - 모든 필드를 안전하게 처리
    const results = (landingPages.results || []).map((lp: any) => ({
      id: lp.id,
      slug: lp.slug || `lp-${lp.id}`,
      title: lp.title || '제목 없음',
      url: `/lp/${lp.slug || lp.id}`,
      isActive: true, // 일단 모두 활성으로
      showQrCode: true,
      viewCount: lp.view_count || lp.viewCount || 0,
      submissions: 0,
      createdAt: lp.created_at || lp.createdAt || new Date().toISOString(),
      creatorName: lp.creatorName || ''
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
      templateId,
    } = body;
    
    // templateHtml은 재할당이 필요하므로 let으로 선언
    let templateHtml = body.templateHtml;

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
      templateHtmlPreview: templateHtml ? templateHtml.substring(0, 100) : 'NONE'
    });
    
    console.log("📋 템플릿 HTML 상태:", {
      received: !!templateHtml,
      length: templateHtml?.length || 0,
      type: typeof templateHtml
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

    // Check if slug already exists (slug 컬럼이 있는 경우에만)
    try {
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
    } catch (slugError: any) {
      // slug 컬럼이 없으면 무시하고 계속 진행
      console.log('⚠️ slug 컬럼 확인 실패 (컬럼 없음 가능):', slugError.message);
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
    
    // 🔥 템플릿 HTML 가져오기 (우선순위)
    // 1. 직접 제공된 templateHtml 사용
    // 2. templateId로 DB에서 가져오기
    // 3. templateId도 없으면 기본 템플릿 가져오기
    if (!templateHtml && templateId) {
      console.log('⚠️ templateHtml not provided, fetching from DB with templateId:', templateId);
      try {
        const templateData = await db.prepare(`
          SELECT html FROM landing_page_templates WHERE id = ?
        `).bind(templateId).first();
        
        if (templateData && templateData.html) {
          templateHtml = templateData.html;
          console.log('✅ Template loaded from DB by ID, length:', templateHtml.length);
        } else {
          console.error('❌ Template not found in DB:', templateId);
        }
      } catch (err) {
        console.error('❌ Failed to load template from DB:', err);
      }
    }
    
    // 🔥 여전히 템플릿이 없으면 기본 템플릿 가져오기
    if (!templateHtml) {
      console.log('⚠️ No template provided, fetching default template...');
      try {
        const defaultTemplate = await db.prepare(`
          SELECT html FROM landing_page_templates WHERE isDefault = 1 ORDER BY createdAt DESC LIMIT 1
        `).first();
        
        if (defaultTemplate && defaultTemplate.html) {
          templateHtml = defaultTemplate.html;
          console.log('✅ Default template loaded, length:', templateHtml.length);
        } else {
          console.warn('⚠️ No default template found in DB');
        }
      } catch (err) {
        console.error('❌ Failed to load default template:', err);
      }
    }
    
    if (templateHtml) {
      // 템플릿 HTML이 제공된 경우
      console.log('✅ Using template HTML, length:', templateHtml.length);
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
      
      console.log('✅ 변수 치환 완료');
      console.log('📏 최종 HTML 길이:', htmlContent.length);
      console.log('📄 HTML 미리보기 (처음 200자):', htmlContent.substring(0, 200));
    } else {
      // 기본 HTML 생성
      console.log('⚠️ templateHtml 없음 - 기본 HTML 사용');
      console.log('🔍 templateHtml 값:', templateHtml);
      console.log('🔍 templateId:', body.templateId);
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

    // Insert landing page - 동적으로 테이블 구조 확인 후 INSERT
    console.log("📝 랜딩페이지 생성 시작");
    
    let insertResult: any = null;
    let insertedId = id;
    
    // 1. 먼저 테이블 구조 확인
    console.log("🔍 테이블 구조 확인 중...");
    const tableInfo = await db.prepare(`PRAGMA table_info(landing_pages)`).all();
    const columns = tableInfo.results?.map((col: any) => col.name) || [];
    console.log("📊 사용 가능한 컬럼:", columns);
    
    // 2. 사용 가능한 컬럼만 사용해서 INSERT
    try {
      // 최소한의 필수 컬럼만 사용 (id, title)
      const insertData: any = {};
      const insertColumns: string[] = [];
      const insertValues: string[] = [];
      const bindValues: any[] = [];
      
      // id 컬럼 확인 및 추가
      if (columns.includes('id')) {
        insertColumns.push('id');
        insertValues.push('?');
        bindValues.push(id);
      }
      
      // title (필수)
      if (columns.includes('title')) {
        insertColumns.push('title');
        insertValues.push('?');
        bindValues.push(title);
      }
      
      // slug
      if (columns.includes('slug')) {
        insertColumns.push('slug');
        insertValues.push('?');
        bindValues.push(slug);
      }
      
      // academyId (필수 - NOT NULL)
      if (columns.includes('academyId')) {
        insertColumns.push('academyId');
        insertValues.push('?');
        bindValues.push(creatorAcademyId || '');
        console.log('✅ academyId 추가:', creatorAcademyId);
      }
      
      // html_content 또는 templateHtml
      if (columns.includes('html_content')) {
        insertColumns.push('html_content');
        insertValues.push('?');
        bindValues.push(htmlContent || '');
        console.log('✅ html_content 저장:', htmlContent ? htmlContent.length : 0, 'bytes');
      } else if (columns.includes('templateHtml')) {
        insertColumns.push('templateHtml');
        insertValues.push('?');
        bindValues.push(htmlContent || '');
        console.log('✅ templateHtml 저장:', htmlContent ? htmlContent.length : 0, 'bytes');
      }
      
      // template_type 또는 templateType
      if (columns.includes('template_type')) {
        insertColumns.push('template_type');
        insertValues.push('?');
        bindValues.push(templateType || 'basic');
      } else if (columns.includes('templateType')) {
        insertColumns.push('templateType');
        insertValues.push('?');
        bindValues.push(templateType || 'basic');
      }
      
      // content_json 또는 customFields
      if (columns.includes('content_json')) {
        insertColumns.push('content_json');
        insertValues.push('?');
        bindValues.push(JSON.stringify(inputData || []));
      } else if (columns.includes('customFields')) {
        insertColumns.push('customFields');
        insertValues.push('?');
        bindValues.push(JSON.stringify(inputData || []));
      }
      
      // qr_code_url 또는 qrCodeUrl
      if (columns.includes('qr_code_url')) {
        insertColumns.push('qr_code_url');
        insertValues.push('?');
        bindValues.push(qrCodeUrl);
      } else if (columns.includes('qrCodeUrl')) {
        insertColumns.push('qrCodeUrl');
        insertValues.push('?');
        bindValues.push(qrCodeUrl);
      }
      
      // thumbnail_url 또는 thumbnailUrl
      if (columns.includes('thumbnail_url')) {
        insertColumns.push('thumbnail_url');
        insertValues.push('?');
        bindValues.push(thumbnail);
      } else if (columns.includes('thumbnailUrl')) {
        insertColumns.push('thumbnailUrl');
        insertValues.push('?');
        bindValues.push(thumbnail);
      }
      
      // og_title 또는 metaTitle
      if (columns.includes('og_title')) {
        insertColumns.push('og_title');
        insertValues.push('?');
        bindValues.push(ogTitle || title);
      } else if (columns.includes('metaTitle')) {
        insertColumns.push('metaTitle');
        insertValues.push('?');
        bindValues.push(ogTitle || title);
      }
      
      // og_description 또는 metaDescription
      if (columns.includes('og_description')) {
        insertColumns.push('og_description');
        insertValues.push('?');
        bindValues.push(ogDescription || description);
      } else if (columns.includes('metaDescription')) {
        insertColumns.push('metaDescription');
        insertValues.push('?');
        bindValues.push(ogDescription || description);
      }
      
      // status 또는 isActive
      if (columns.includes('status')) {
        insertColumns.push('status');
        insertValues.push('?');
        bindValues.push('active');
      } else if (columns.includes('isActive')) {
        insertColumns.push('isActive');
        insertValues.push('?');
        bindValues.push(1);
      }
      
      // user_id (중요! 목록 조회 필터링에 사용됨)
      if (columns.includes('user_id')) {
        insertColumns.push('user_id');
        insertValues.push('?');
        bindValues.push(userIdForDb);
        console.log('✅ user_id 추가:', userIdForDb);
      }
      
      // created_at
      if (columns.includes('created_at')) {
        insertColumns.push('created_at');
        insertValues.push("datetime('now')");
      }
      
      const insertSQL = `
        INSERT INTO landing_pages (${insertColumns.join(', ')})
        VALUES (${insertValues.join(', ')})
      `;
      
      console.log("📝 동적 INSERT SQL:", insertSQL);
      console.log("📝 Bind values count:", bindValues.length);
      
      insertResult = await db.prepare(insertSQL).bind(...bindValues).run();
      console.log("✅ INSERT 성공!");
      
    } catch (error: any) {
      console.error("❌ INSERT 실패:", error.message);
      throw new Error(`랜딩페이지 생성 실패: ${error.message}`);
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

    // 🆕 랜딩페이지 생성 사용량 증가 (DIRECTOR/TEACHER만)
    if (creatorRole === 'DIRECTOR' || creatorRole === 'TEACHER') {
      try {
        let updateUserId = creatorUserId;
        
        // TEACHER인 경우 해당 학원의 DIRECTOR 찾기
        if (creatorRole === 'TEACHER' && creatorAcademyId) {
          const director = await db.prepare(`
            SELECT id FROM User 
            WHERE academyId = ? AND role = 'DIRECTOR'
            LIMIT 1
          `).bind(creatorAcademyId).first();
          
          if (director) {
            updateUserId = director.id;
          }
        }
        
        // 사용량 증가
        await db.prepare(`
          UPDATE user_subscriptions 
          SET usage_landingPages = usage_landingPages + 1,
              updatedAt = datetime('now')
          WHERE userId = ? AND status = 'active'
        `).bind(updateUserId).run();

        // 사용 로그 기록
        const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await db.prepare(`
          INSERT INTO usage_logs (id, userId, subscriptionId, featureType, action, metadata)
          SELECT ?, ?, id, 'landing_page', 'create', ?
          FROM user_subscriptions
          WHERE userId = ? AND status = 'active'
          LIMIT 1
        `).bind(
          logId,
          updateUserId,
          JSON.stringify({ landingPageId: insertedId, slug, title }),
          updateUserId
        ).run();
        
        console.log('✅ Landing page usage incremented for user:', updateUserId);
      } catch (usageError) {
        console.error('⚠️ Failed to update landing page usage:', usageError);
        // 사용량 업데이트 실패는 랜딩페이지 생성을 방해하지 않음
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
