// 기본 템플릿 생성 API
interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { env } = context;
    const db = env.DB;
    
    console.log('🎨 기본 템플릿 생성 시작');
    
    // 기존 템플릿 확인
    const existing = await db.prepare(`
      SELECT COUNT(*) as count FROM landing_page_templates
    `).first();
    
    console.log('📊 기존 템플릿 수:', existing?.count || 0);
    
    // 샘플 HTML 템플릿
    const sampleHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      padding: 60px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #1a202c;
      font-size: 48px;
      margin-bottom: 16px;
      font-weight: 800;
    }
    .subtitle {
      color: #667eea;
      font-size: 24px;
      margin-bottom: 40px;
      font-weight: 600;
    }
    .student-name {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 40px 0;
    }
    .stat-card {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 30px;
      border-radius: 16px;
      text-align: center;
      color: white;
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
      transition: transform 0.3s;
    }
    .stat-card:hover {
      transform: translateY(-8px);
    }
    .stat-label {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 12px;
    }
    .stat-value {
      font-size: 48px;
      font-weight: 800;
      line-height: 1;
    }
    .period {
      text-align: center;
      padding: 20px;
      background: #f7fafc;
      border-radius: 12px;
      color: #4a5568;
      font-size: 18px;
      font-weight: 600;
      margin: 40px 0;
    }
    .footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 40px;
      border-top: 2px solid #e2e8f0;
      color: #718096;
      font-size: 16px;
    }
    .academy-name {
      font-weight: 700;
      color: #667eea;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📚 학습 리포트</h1>
    <p class="subtitle">
      <span class="student-name">{{studentName}}</span> 학생의 학습 현황입니다
    </p>
    
    <div class="period">
      📅 학습 기간: {{period}}
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">📊 출석률</div>
        <div class="stat-value">{{attendanceRate}}</div>
      </div>
      
      <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
        <div class="stat-label">✅ 출석일</div>
        <div class="stat-value">{{presentDays}}일</div>
      </div>
      
      <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
        <div class="stat-label">📝 숙제 완료율</div>
        <div class="stat-value">{{homeworkRate}}</div>
      </div>
      
      <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
        <div class="stat-label">💬 AI 대화</div>
        <div class="stat-value">{{aiChatCount}}회</div>
      </div>
    </div>
    
    <div class="footer">
      <p><span class="academy-name">{{academyName}}</span>에서 제공하는 학습 리포트입니다</p>
      <p style="margin-top: 8px; font-size: 14px;">담당: {{directorName}}</p>
    </div>
  </div>
</body>
</html>`;

    const templateId = `tpl_${Date.now()}`;
    
    // 템플릿 저장
    await db.prepare(`
      INSERT INTO landing_page_templates (
        id, name, description, html, isDefault, createdAt
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      templateId,
      '기본 학습 리포트 템플릿',
      '그라데이션 배경과 카드 형식의 깔끔한 템플릿',
      sampleHtml,
      1  // 기본 템플릿으로 설정
    ).run();
    
    console.log('✅ 템플릿 생성 완료:', templateId);
    
    // 저장 확인
    const saved = await db.prepare(`
      SELECT id, name, LENGTH(html) as htmlLength, isDefault
      FROM landing_page_templates 
      WHERE id = ?
    `).bind(templateId).first();
    
    return new Response(JSON.stringify({
      success: true,
      message: '기본 템플릿이 생성되었습니다',
      template: {
        id: saved?.id,
        name: saved?.name,
        htmlLength: saved?.htmlLength,
        isDefault: saved?.isDefault === 1
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('❌ 템플릿 생성 오류:', error);
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
