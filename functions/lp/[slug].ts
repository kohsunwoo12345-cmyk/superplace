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

    console.log("🔍 Trying to fetch landing page:", slug);

    // Try multiple table name variations
    let landingPage = null;
    let queryError = null;
    
    // Try lowercase first  
    try {
      console.log("🔍 Trying lowercase table: landing_pages");
      landingPage = await db
        .prepare(
          `SELECT * FROM landing_pages WHERE slug = ? AND status = 'active'`
        )
        .bind(slug)
        .first();
      console.log("✅ Found with lowercase:", !!landingPage);
    } catch (e1: any) {
      console.log("❌ Lowercase failed:", e1.message);
      queryError = e1.message;
      
      // Try uppercase
      try {
        console.log("🔍 Trying uppercase table: LandingPage");
        landingPage = await db
          .prepare(
            `SELECT 
              lp.*,
              u.name as studentName,
              f.name as folderName
            FROM LandingPage lp
            LEFT JOIN User u ON lp.studentId = u.id
            LEFT JOIN LandingPageFolder f ON lp.folderId = f.id
            WHERE lp.slug = ? AND lp.isActive = 1`
          )
          .bind(slug)
          .first();
        console.log("✅ Found with uppercase:", !!landingPage);
      } catch (e2: any) {
        console.log("❌ Uppercase also failed:", e2.message);
        queryError = e2.message;
      }
    }

    if (!landingPage) {
      console.log("❌ Landing page not found for slug:", slug);
      console.log("❌ Query error:", queryError);
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

    // Check if html_content exists and use it
    if (landingPage.html_content) {
      console.log("✅ Using stored html_content");
      
      // Increment view count first
      let currentViewCount = (landingPage.view_count || 0) + 1;
      try {
        await db
          .prepare(`UPDATE landing_pages SET view_count = view_count + 1 WHERE slug = ?`)
          .bind(slug)
          .run();
      } catch (e: any) {
        console.log("⚠️ Could not update view count:", e.message);
      }
      
      // Get student data if user_id exists
      let studentData: any = null;
      if (landingPage.user_id) {
        try {
          studentData = await db
            .prepare(`SELECT * FROM User WHERE id = ?`)
            .bind(landingPage.user_id)
            .first();
        } catch (e: any) {
          console.log("⚠️ Could not fetch student data:", e.message);
        }
      }
      
      // Replace variables in HTML
      let html = landingPage.html_content as string;
      
      // Student variables
      const studentName = studentData?.name || '학생';
      const period = '2024년 1학기'; // TODO: 실제 기간 데이터 사용
      const attendanceRate = '95%'; // TODO: 실제 출석률 데이터
      const totalDays = '20'; // TODO: 실제 데이터
      const presentDays = '19'; // TODO: 실제 데이터
      const absentDays = '1'; // TODO: 실제 데이터
      const tardyDays = '0'; // TODO: 실제 데이터
      const aiChatCount = '0'; // TODO: 실제 데이터
      const homeworkRate = '100%'; // TODO: 실제 데이터
      const homeworkCompleted = '10'; // TODO: 실제 데이터
      
      // Replace variables
      html = html.replace(/\{\{studentName\}\}/g, studentName);
      html = html.replace(/\{\{period\}\}/g, period);
      html = html.replace(/\{\{attendanceRate\}\}/g, attendanceRate);
      html = html.replace(/\{\{totalDays\}\}/g, totalDays);
      html = html.replace(/\{\{presentDays\}\}/g, presentDays);
      html = html.replace(/\{\{absentDays\}\}/g, absentDays);
      html = html.replace(/\{\{tardyDays\}\}/g, tardyDays);
      html = html.replace(/\{\{aiChatCount\}\}/g, aiChatCount);
      html = html.replace(/\{\{homeworkRate\}\}/g, homeworkRate);
      html = html.replace(/\{\{homeworkCompleted\}\}/g, homeworkCompleted);
      html = html.replace(/\{\{viewCount\}\}/g, currentViewCount.toString());
      
      // Return processed HTML
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    
    console.log("⚠️ No html_content found, generating default HTML");

    // Increment view count (try both table names)
    try {
      await db
        .prepare(`UPDATE landing_pages SET views = views + 1 WHERE slug = ?`)
        .bind(slug)
        .run();
    } catch {
      try {
        await db
          .prepare(`UPDATE LandingPage SET viewCount = viewCount + 1 WHERE slug = ?`)
          .bind(slug)
          .run();
      } catch (e: any) {
        console.log("⚠️ Could not update view count:", e.message);
      }
    }

    // Get pixel scripts (try both table names)
    let pixelScripts: any = { results: [] };
    try {
      pixelScripts = await db
        .prepare(
          `SELECT * FROM landing_page_pixel_scripts 
        WHERE landingPageId = ? AND isActive = 1
        ORDER BY scriptType`
        )
        .bind(landingPage.id)
        .all();
    } catch {
      try {
        pixelScripts = await db
          .prepare(
            `SELECT * FROM LandingPagePixelScript 
          WHERE landingPageId = ? AND isActive = 1
          ORDER BY scriptType`
          )
          .bind(landingPage.id)
          .all();
      } catch (e: any) {
        console.log("⚠️ Could not fetch pixel scripts:", e.message);
      }
    }

    // Parse data
    const inputData = landingPage.inputData
      ? JSON.parse(landingPage.inputData as string)
      : [];
    const scripts = pixelScripts.results || [];

    // Build pixel scripts HTML
    const headerScripts = scripts
      .filter((s: any) => s.scriptType === "header")
      .map((s: any) => s.scriptCode)
      .join("\n");

    const bodyScripts = scripts
      .filter((s: any) => s.scriptType === "body" || s.scriptType === "footer")
      .map((s: any) => s.scriptCode)
      .join("\n");

    // Build form fields HTML
    const formFieldsHtml = inputData
      .sort((a: any, b: any) => a.order - b.order)
      .map(
        (field: any) => `
      <div class="field">
        <label>
          ${field.label}${field.required ? '<span class="required">*</span>' : ""}
        </label>
        ${
          field.type === "textarea"
            ? `<textarea name="${field.id}" placeholder="${
                field.placeholder || ""
              }" ${field.required ? "required" : ""}></textarea>`
            : field.type === "checkbox"
            ? `<div class="checkbox-wrapper">
                <input type="checkbox" name="${field.id}" id="${field.id}" ${
                field.required ? "required" : ""
              }>
                <label for="${field.id}" class="checkbox-label">${
                field.placeholder || field.label
              }</label>
              </div>`
            : `<input type="${field.type}" name="${field.id}" placeholder="${
                field.placeholder || ""
              }" ${field.required ? "required" : ""}>`
        }
      </div>
    `
      )
      .join("");

    // QR Code HTML
    const qrCodeHtml =
      landingPage.showQrCode && landingPage.qrCodeUrl
        ? `<div class="qr-code">
          <img src="${landingPage.qrCodeUrl}" alt="QR Code" width="150" height="150">
          <p>스캔하여 접속하세요</p>
        </div>`
        : "";

    // Thumbnail HTML
    const thumbnailHtml = landingPage.thumbnail
      ? `<img src="${landingPage.thumbnail}" alt="${landingPage.title}" class="thumbnail">`
      : "";

    // Generate HTML
    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${landingPage.title}</title>
  <meta property="og:title" content="${landingPage.ogTitle || landingPage.title}">
  <meta property="og:description" content="${
    landingPage.ogDescription || landingPage.description || ""
  }">
  <meta property="og:image" content="${landingPage.thumbnail || ""}">
  ${headerScripts}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
    .content { padding: 40px; }
    .thumbnail { width: 100%; height: auto; display: block; }
    h1 { color: #111827; font-size: 36px; margin-bottom: 12px; }
    .subtitle { color: #6b7280; font-size: 20px; margin-bottom: 24px; }
    .description { color: #374151; margin-bottom: 32px; line-height: 1.6; }
    .field { margin-bottom: 24px; }
    label { display: block; font-weight: 600; margin-bottom: 8px; color: #374151; font-size: 14px; }
    input, textarea { width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 15px; transition: border-color 0.2s; }
    input:focus, textarea:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    textarea { min-height: 120px; resize: vertical; font-family: inherit; }
    .checkbox-wrapper { display: flex; align-items: center; gap: 12px; }
    .checkbox-wrapper input[type="checkbox"] { width: auto; }
    .checkbox-label { font-weight: normal; margin: 0; cursor: pointer; }
    .required { color: #ef4444; margin-left: 4px; }
    button { width: 100%; background: #6366f1; color: white; padding: 16px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 16px; }
    button:hover { background: #4f46e5; }
    button:disabled { background: #9ca3af; cursor: not-allowed; }
    .qr-code { text-align: center; padding: 24px 0; }
    .qr-code img { border-radius: 8px; margin: 0 auto 12px; }
    .qr-code p { color: #6b7280; font-size: 14px; }
    .success { text-align: center; padding: 60px 40px; }
    .success h2 { color: #10b981; font-size: 32px; margin-bottom: 16px; }
    .success p { color: #6b7280; font-size: 18px; }
    .footer { text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; }
    .error { color: #ef4444; font-size: 14px; margin-top: 4px; }
  </style>
</head>
<body>
  ${bodyScripts}
  <div class="container">
    <div class="content">
      ${landingPage.qrCodePosition === "top" ? qrCodeHtml : ""}
      ${thumbnailHtml}
      <h1>${landingPage.title}</h1>
      ${landingPage.subtitle ? `<div class="subtitle">${landingPage.subtitle}</div>` : ""}
      ${landingPage.description ? `<div class="description">${landingPage.description}</div>` : ""}
      
      <form id="landingForm">
        ${formFieldsHtml}
        <button type="submit" id="submitBtn">신청하기</button>
      </form>
      
      ${landingPage.qrCodePosition === "bottom" ? qrCodeHtml : ""}
    </div>
    <div class="footer">
      조회수: ${(landingPage.views || 0) + 1}회
    </div>
  </div>
  
  <script>
    document.getElementById('landingForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = '제출 중...';
      
      const formData = new FormData(e.target);
      const data = {};
      for (const [key, value] of formData.entries()) {
        if (e.target.elements[key].type === 'checkbox') {
          data[key] = e.target.elements[key].checked;
        } else {
          data[key] = value;
        }
      }
      
      try {
        const response = await fetch('/api/landing/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: '${slug}', data })
        });
        
        if (response.ok) {
          document.querySelector('.content').innerHTML = \`
            <div class="success">
              <h2>✅ 신청 완료!</h2>
              <p>신청이 성공적으로 접수되었습니다.<br>곧 연락드리겠습니다.</p>
            </div>
          \`;
        } else {
          throw new Error('제출 실패');
        }
      } catch (error) {
        alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        btn.disabled = false;
        btn.textContent = '신청하기';
      }
    });
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error: any) {
    console.error("랜딩페이지 렌더링 오류:", error);
    return new Response(
      `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>오류 발생</title>
  <style>body{font-family:system-ui;text-align:center;padding:50px;}</style>
</head>
<body>
  <h1>⚠️ 오류가 발생했습니다</h1>
  <p>${error.message}</p>
</body>
</html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
