// Cloudflare Pages Function - 실제 빌더 동작 완전 시뮬레이션
import { STUDENT_GROWTH_REPORT_TEMPLATE } from '../../templates/student-growth-report';

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();
    const { 
      title = "실제 빌더 테스트 학생의 학습 리포트",
      studentName = "테스트 학생" 
    } = body;

    console.log("🎯 실제 빌더 페이지 완전 시뮬레이션 시작");

    // 1. 템플릿 HTML 로드 (빌더 페이지와 동일)
    const templateHtml = STUDENT_GROWTH_REPORT_TEMPLATE;
    console.log("✅ 템플릿 HTML 로드 완료, length:", templateHtml.length);

    if (!templateHtml || templateHtml.length < 1000) {
      throw new Error("템플릿 HTML 로드 실패 또는 너무 짧음");
    }

    // 2. Slug 생성 (빌더와 동일)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const slug = `lp_${timestamp}_${random}`;

    // 3. 사용자 ID (테스트용)
    const userId = `builder-test-${Date.now()}`;
    const userIdHash = Math.abs(
      userId.split('').reduce((acc, char) => 
        ((acc << 5) - acc) + char.charCodeAt(0), 0
      )
    );

    // 4. HTML 변수 치환 (백엔드 API와 동일)
    let htmlContent = templateHtml;
    htmlContent = htmlContent.replace(/\{\{title\}\}/g, title);
    htmlContent = htmlContent.replace(/\{\{studentName\}\}/g, studentName);
    htmlContent = htmlContent.replace(/\{\{period\}\}/g, '2024년 1학기');
    htmlContent = htmlContent.replace(/\{\{attendanceRate\}\}/g, '95%');
    htmlContent = htmlContent.replace(/\{\{totalDays\}\}/g, '40');
    htmlContent = htmlContent.replace(/\{\{presentDays\}\}/g, '38');
    htmlContent = htmlContent.replace(/\{\{tardyDays\}\}/g, '1');
    htmlContent = htmlContent.replace(/\{\{absentDays\}\}/g, '1');
    htmlContent = htmlContent.replace(/\{\{homeworkRate\}\}/g, '90%');
    htmlContent = htmlContent.replace(/\{\{homeworkCompleted\}\}/g, '36');
    htmlContent = htmlContent.replace(/\{\{homeworkTotal\}\}/g, '40');
    htmlContent = htmlContent.replace(/\{\{aiChatCount\}\}/g, '127');
    htmlContent = htmlContent.replace(/\{\{academyName\}\}/g, '슈퍼플레이스 스터디');
    htmlContent = htmlContent.replace(/\{\{directorName\}\}/g, '홍길동');

    console.log("✅ HTML 변수 치환 완료, length:", htmlContent.length);

    // 5. DB에 저장 (구 스키마)
    try {
      const insertResult = await DB.prepare(`
        INSERT INTO landing_pages 
        (slug, title, user_id, template_type, content_json, html_content, 
         qr_code_url, thumbnail_url, og_title, og_description, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `).bind(
        slug,
        title,
        userIdHash,
        'student_report',
        JSON.stringify({ builderTest: true, timestamp }),
        htmlContent,
        null,
        null,
        title,
        `${studentName}의 학습 성과를 확인하세요`
      ).run();
      
      console.log("✅ DB INSERT 성공:", insertResult);

      // 6. 저장된 페이지 확인
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const savedPage = await DB.prepare(`
        SELECT id, slug, title, template_type, 
               LENGTH(html_content) as html_length,
               view_count, status, created_at
        FROM landing_pages 
        WHERE slug = ?
      `).bind(slug).first();

      console.log("✅ 저장된 페이지 확인:", savedPage);

      const publicUrl = `https://superplacestudy.pages.dev/lp/${slug}`;

      return new Response(JSON.stringify({
        success: true,
        message: "✅ 실제 빌더 시뮬레이션 성공!",
        landingPage: {
          id: savedPage?.id,
          slug: slug,
          url: `/lp/${slug}`,
          publicUrl: publicUrl,
          title: title,
          templateType: 'student_report',
          status: savedPage?.status
        },
        debug: {
          templateLoaded: true,
          templateOriginalLength: templateHtml.length,
          htmlProcessedLength: htmlContent.length,
          dbSaved: !!savedPage,
          dbHtmlLength: savedPage?.html_length || 0,
          timestampMatch: templateHtml.length === htmlContent.length ? "동일" : "치환됨"
        },
        verification: {
          step1_templateLoad: templateHtml.length > 1000 ? "✅ PASS" : "❌ FAIL",
          step2_variableReplace: htmlContent.includes(studentName) ? "✅ PASS" : "❌ FAIL",
          step3_dbInsert: !!savedPage ? "✅ PASS" : "❌ FAIL",
          step4_lengthCheck: savedPage?.html_length === htmlContent.length ? "✅ PASS" : "❌ FAIL"
        }
      }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (dbError: any) {
      console.error("❌ DB 저장 실패:", dbError);
      return new Response(JSON.stringify({
        success: false,
        error: "DB 저장 실패",
        message: dbError.message,
        debug: {
          templateLoaded: true,
          templateLength: templateHtml.length,
          htmlLength: htmlContent.length
        }
      }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error("❌ 전체 프로세스 실패:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
