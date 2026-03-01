// Cloudflare Pages Function - 샘플 랜딩페이지 생성
interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const db = context.env.DB;
    
    // 샘플 데이터
    const id = `lp_sample_${Date.now()}`;
    const slug = `sample-${Date.now()}`;
    const title = "김민준 학생의 학습 리포트";
    const createdById = "test-user-001";
    
    const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .header { text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); border-radius: 15px; color: white; }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { font-size: 18px; opacity: 0.9; }
    .section { margin-bottom: 30px; padding: 25px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #3b82f6; }
    .section h2 { color: #1e293b; font-size: 24px; margin-bottom: 15px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px; }
    .stat-card { background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stat-card .label { color: #64748b; font-size: 14px; margin-bottom: 8px; }
    .stat-card .value { color: #1e293b; font-size: 28px; font-weight: bold; }
    .footer { text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid #e2e8f0; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 ${title}</h1>
      <p>2024년 1학기 학습 성과 리포트</p>
    </div>
    
    <div class="section">
      <h2>📊 출석 현황</h2>
      <div class="stats">
        <div class="stat-card">
          <div class="label">출석률</div>
          <div class="value">95%</div>
        </div>
        <div class="stat-card">
          <div class="label">총 일수</div>
          <div class="value">40일</div>
        </div>
        <div class="stat-card">
          <div class="label">출석</div>
          <div class="value">38일</div>
        </div>
        <div class="stat-card">
          <div class="label">지각</div>
          <div class="value">1일</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>📝 과제 완수율</h2>
      <div class="stats">
        <div class="stat-card">
          <div class="label">완수율</div>
          <div class="value">90%</div>
        </div>
        <div class="stat-card">
          <div class="label">완료</div>
          <div class="value">36개</div>
        </div>
        <div class="stat-card">
          <div class="label">미완료</div>
          <div class="value">4개</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>🤖 AI 스마트 튜터링</h2>
      <div class="stats">
        <div class="stat-card">
          <div class="label">대화 횟수</div>
          <div class="value">127회</div>
        </div>
        <div class="stat-card">
          <div class="label">평균 응답시간</div>
          <div class="value">2.3초</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>💬 원장님 종합 평가</h2>
      <p style="line-height: 1.8; color: #475569; font-size: 16px;">
        민준 학생은 이번 학기 동안 꾸준한 출석과 높은 과제 완수율을 보여주었습니다. 
        특히 AI 튜터를 적극 활용하여 학습 효과를 극대화하고 있으며, 
        지속적인 성장세를 보이고 있습니다. 다음 학기에도 이런 태도를 유지한다면 
        더욱 큰 발전이 기대됩니다.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>슈퍼플레이스 스터디</strong></p>
      <p>원장: 홍길동</p>
      <p style="margin-top: 10px; font-size: 12px;">본 리포트는 ${new Date().toLocaleDateString('ko-KR')} 생성되었습니다.</p>
    </div>
  </div>
</body>
</html>`;

    console.log("📝 샘플 랜딩페이지 생성 시작");
    console.log("📝 데이터:", { id, slug, title, createdById });
    
    // 먼저 신 스키마로 시도
    try {
      const insertResult = await db
        .prepare(`
          INSERT INTO landing_pages 
          (id, slug, title, templateType, templateHtml, isActive, createdById) 
          VALUES (?, ?, ?, 'student_report', ?, 1, ?)
        `)
        .bind(id, slug, title, htmlContent, createdById)
        .run();
      
      console.log("✅ 신 스키마 INSERT 성공:", JSON.stringify(insertResult));
    } catch (error: any) {
      console.log("⚠️ 신 스키마 실패, 구 스키마로 시도:", error.message);
      
      // 구 스키마로 재시도 (user_id 추가)
      const insertResult = await db
        .prepare(`
          INSERT INTO landing_pages 
          (slug, title, user_id, template_type, html_content, status) 
          VALUES (?, ?, 1, 'student_report', ?, 'active')
        `)
        .bind(slug, title, htmlContent)
        .run();
      
      console.log("✅ 구 스키마 INSERT 성공:", JSON.stringify(insertResult));
    }
    
    // 확인
    const check = await db
      .prepare(`SELECT id, slug, title FROM landing_pages WHERE slug = ?`)
      .bind(slug)
      .first();
    
    console.log("✅ 생성 확인:", JSON.stringify(check));
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "샘플 랜딩페이지 생성 완료",
        landingPage: {
          id,
          slug,
          url: `/lp/${slug}`,
          title
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ 샘플 생성 실패:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "샘플 생성 실패",
        details: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
