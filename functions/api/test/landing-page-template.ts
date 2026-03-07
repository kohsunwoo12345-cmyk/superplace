// 랜딩페이지 템플릿 테스트 API
interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request, env } = context;
    const db = env.DB;
    
    console.log('🧪 템플릿 테스트 API 시작');
    
    // 1. 모든 템플릿 조회
    const templates = await db.prepare(`
      SELECT id, name, description, html, isDefault 
      FROM landing_page_templates
      ORDER BY isDefault DESC, id DESC
    `).all();
    
    console.log('📋 템플릿 수:', templates.results?.length || 0);
    
    if (templates.results && templates.results.length > 0) {
      templates.results.forEach((t: any) => {
        console.log('📄 템플릿:', {
          id: t.id,
          name: t.name,
          isDefault: t.isDefault,
          hasHtml: !!t.html,
          htmlLength: t.html?.length || 0,
          htmlPreview: t.html?.substring(0, 100)
        });
      });
    }
    
    // 2. 테스트 랜딩페이지 생성
    const testSlug = `test_${Date.now()}`;
    const defaultTemplate = templates.results?.find((t: any) => t.isDefault);
    
    if (!defaultTemplate) {
      return new Response(JSON.stringify({
        success: false,
        error: '기본 템플릿이 없습니다',
        templates: templates.results
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ 기본 템플릿 선택:', defaultTemplate.name);
    console.log('📝 HTML 길이:', defaultTemplate.html?.length || 0);
    
    // 변수 치환
    let htmlContent = defaultTemplate.html || '';
    htmlContent = htmlContent.replace(/\{\{studentName\}\}/g, '테스트 학생');
    htmlContent = htmlContent.replace(/\{\{period\}\}/g, '2024년 1월 ~ 3월');
    htmlContent = htmlContent.replace(/\{\{attendanceRate\}\}/g, '95%');
    htmlContent = htmlContent.replace(/\{\{academyName\}\}/g, '테스트 학원');
    htmlContent = htmlContent.replace(/\{\{directorName\}\}/g, '테스트 원장');
    
    console.log('✅ 변수 치환 완료, 최종 길이:', htmlContent.length);
    
    // 3. DB에 저장
    const insertResult = await db.prepare(`
      INSERT INTO landing_pages (
        slug, title, subtitle, html_content, template_type, 
        status, created_at, academyId, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
    `).bind(
      testSlug,
      '템플릿 테스트',
      '템플릿 적용 확인',
      htmlContent,
      'template',
      'active',
      'test-academy',
      999
    ).run();
    
    console.log('✅ DB 저장 완료');
    
    // 4. 저장된 데이터 조회
    const saved = await db.prepare(`
      SELECT id, slug, title, html_content 
      FROM landing_pages 
      WHERE slug = ?
    `).bind(testSlug).first();
    
    console.log('✅ 저장된 데이터 확인:', {
      id: saved?.id,
      slug: saved?.slug,
      hasHtmlContent: !!saved?.html_content,
      htmlLength: saved?.html_content?.length || 0
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: '템플릿 테스트 완료',
      testUrl: `/lp/${testSlug}`,
      template: {
        id: defaultTemplate.id,
        name: defaultTemplate.name,
        htmlLength: defaultTemplate.html?.length || 0
      },
      saved: {
        slug: saved?.slug,
        htmlLength: saved?.html_content?.length || 0,
        matches: saved?.html_content === htmlContent
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ 테스트 오류:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
