// 🔥 EMERGENCY FIX - 자동 테이블 생성 및 템플릿 초기화
// POST /api/setup/initialize-all

interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const startTime = Date.now();
  console.log('🚀 Initialize ALL - Starting...');
  
  try {
    const body = await context.request.json();
    const { password } = body;
    
    if (password !== "setup-all-2026") {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Invalid password" 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;
    const results = [];

    // 1️⃣ LandingPageTemplate 테이블 생성
    console.log('📋 Step 1: Creating LandingPageTemplate table...');
    try {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS LandingPageTemplate (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          html TEXT NOT NULL,
          variables TEXT,
          isDefault INTEGER DEFAULT 0,
          usageCount INTEGER DEFAULT 0,
          createdById TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      results.push({ step: 1, action: "LandingPageTemplate table", status: "✅ Created" });
      console.log('✅ LandingPageTemplate table created');
    } catch (error: any) {
      results.push({ step: 1, action: "LandingPageTemplate table", status: "❌ Error", error: error.message });
      console.error('❌ Table creation failed:', error);
    }

    // 2️⃣ 인덱스 생성
    console.log('📋 Step 2: Creating indexes...');
    try {
      await db.exec(`CREATE INDEX IF NOT EXISTS idx_landing_template_creator ON LandingPageTemplate(createdById);`);
      await db.exec(`CREATE INDEX IF NOT EXISTS idx_landing_template_default ON LandingPageTemplate(isDefault);`);
      results.push({ step: 2, action: "Indexes", status: "✅ Created" });
      console.log('✅ Indexes created');
    } catch (error: any) {
      results.push({ step: 2, action: "Indexes", status: "⚠️ Warning", error: error.message });
    }

    // 3️⃣ 상세 템플릿 삽입
    console.log('📋 Step 3: Inserting detailed template...');
    try {
      await db.prepare(`
        INSERT OR REPLACE INTO LandingPageTemplate (
          id, name, description, html, variables, isDefault, usageCount, createdById, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        'tpl_student_detailed_001',
        '🌟 학생 성장 상세 리포트',
        '문제점→개선과정→결과까지 완벽한 스토리',
        '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{studentName}} 성장 리포트</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;padding:20px}.container{max-width:900px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3)}.header{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:50px 30px;text-align:center;border-radius:16px 16px 0 0}.header h1{font-size:36px;margin-bottom:10px}.header .period{font-size:20px;opacity:.95}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:40px 30px}.stat{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:30px;border-radius:12px;text-align:center;box-shadow:0 4px 15px rgba(102,126,234,.4)}.stat-value{font-size:48px;font-weight:700;margin-bottom:5px}.stat-label{font-size:15px;opacity:.9}.section{margin:0 30px 30px;padding:35px;background:#f9fafb;border-radius:12px}.section-title{font-size:26px;font-weight:700;color:#1f2937;margin-bottom:25px;padding-left:18px;border-left:5px solid #667eea}.problem{background:#fee2e2;border-left:5px solid #ef4444;padding:25px;border-radius:10px;margin-bottom:20px}.problem h3{font-size:20px;color:#991b1b;margin-bottom:15px;display:flex;align-items:center;gap:10px}.problem p{color:#7f1d1d;line-height:1.9;font-size:16px}.freq{background:#fff;padding:18px;border-radius:8px;margin-top:15px;display:flex;justify-content:space-between;align-items:center}.freq-label{font-weight:600;color:#374151}.freq-value{color:#ef4444;font-weight:700;font-size:18px}.process{background:#dbeafe;border-left:5px solid #3b82f6;padding:25px;border-radius:10px}.process h3{font-size:20px;color:#1e40af;margin-bottom:20px;display:flex;align-items:center;gap:10px}.step{margin:15px 0;padding-left:30px;position:relative}.step::before{content:"✓";position:absolute;left:0;color:#3b82f6;font-weight:700;font-size:22px}.step-text{color:#1e3a8a;line-height:1.9;font-size:16px}.step strong{color:#1e40af}.result{background:#d1fae5;border-left:5px solid#10b981;padding:25px;border-radius:10px;margin-bottom:25px}.result h3{font-size:20px;color:#065f46;margin-bottom:15px;display:flex;align-items:center;gap:10px}.result p{color:#064e3b;line-height:1.9;font-size:16px}.metric{background:#fff;padding:20px;border-radius:10px;margin:15px 0;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,.05)}.metric-label{font-size:17px;font-weight:600;color:#374151}.metric-change{display:flex;align-items:center;gap:12px}.before{color:#ef4444;font-weight:700;font-size:18px}.arrow{color:#6b7280;font-size:24px}.after{color:#10b981;font-weight:700;font-size:22px}.comment{background:#fff;padding:30px;border-radius:10px;border:2px solid #e5e7eb;line-height:1.9;color:#374151;font-size:16px}.footer{text-align:center;padding:40px 30px;background:#f9fafb;color:#6b7280;border-radius:0 0 16px 16px}.footer strong{color:#1f2937;font-size:18px}.footer p{margin-top:12px}@media(max-width:768px){.stats{grid-template-columns:1fr}.metric{flex-direction:column;gap:12px;text-align:center}}</style></head><body><div class="container"><div class="header"><h1>🌟 {{studentName}} 학생 성장 리포트</h1><div class="period">{{period}}</div></div><div class="stats"><div class="stat"><div class="stat-value">{{attendanceRate}}%</div><div class="stat-label">출석률</div></div><div class="stat"><div class="stat-value">{{homeworkRate}}%</div><div class="stat-label">과제 완성률</div></div><div class="stat"><div class="stat-value">{{avgScore}}점</div><div class="stat-label">평균 점수</div></div></div><div class="section"><div class="section-title">🔍 발견된 문제점</div><div class="problem"><h3><span>⚠️</span>주요 문제</h3><p>{{problemDescription}}</p></div><div class="freq"><span class="freq-label">문제 발생 빈도</span><span class="freq-value">{{problemFrequency}}</span></div></div><div class="section"><div class="section-title">💡 개선 과정</div><div class="process"><h3><span>🎯</span>실행한 개선 방법</h3><div class="step"><div class="step-text"><strong>1단계:</strong> {{improvementStep1}}</div></div><div class="step"><div class="step-text"><strong>2단계:</strong> {{improvementStep2}}</div></div><div class="step"><div class="step-text"><strong>3단계:</strong> {{improvementStep3}}</div></div></div></div><div class="section"><div class="section-title">📈 개선 결과</div><div class="result"><h3><span>✅</span>달성한 성과</h3><p>{{achievementDescription}}</p></div><div class="metric"><span class="metric-label">점수 변화</span><div class="metric-change"><span class="before">{{scoreBefore}}점</span><span class="arrow">→</span><span class="after">{{scoreAfter}}점</span></div></div><div class="metric"><span class="metric-label">이해도 변화</span><div class="metric-change"><span class="before">{{understandingBefore}}%</span><span class="arrow">→</span><span class="after">{{understandingAfter}}%</span></div></div><div class="metric"><span class="metric-label">학습 태도</span><div class="metric-change"><span class="before">{{attitudeBefore}}</span><span class="arrow">→</span><span class="after">{{attitudeAfter}}</span></div></div></div><div class="section"><div class="section-title">💬 선생님 총평</div><div class="comment">{{teacherComment}}</div></div><div class="footer"><p><strong>{{academyName}}</strong>에서 제공하는 학습 리포트입니다.</p><p>생성일: {{generatedDate}}</p></div></div></body></html>',
        '["studentName","period","attendanceRate","homeworkRate","avgScore","problemDescription","problemFrequency","improvementStep1","improvementStep2","improvementStep3","achievementDescription","scoreBefore","scoreAfter","understandingBefore","understandingAfter","attitudeBefore","attitudeAfter","teacherComment","academyName","generatedDate"]',
        1,
        0,
        'system'
      ).run();
      
      results.push({ step: 4, action: "Detailed template", status: "✅ Inserted", id: 'tpl_student_detailed_001' });
      console.log('✅ Detailed template inserted');
    } catch (error: any) {
      results.push({ step: 4, action: "Detailed template", status: "❌ Error", error: error.message });
      console.error('❌ Template insertion failed:', error);
    }

    // 5️⃣ 확인
    console.log('📋 Step 5: Verifying...');
    const count = await db.prepare('SELECT COUNT(*) as count FROM LandingPageTemplate').first();
    const templates = await db.prepare('SELECT id, name, isDefault FROM LandingPageTemplate ORDER BY isDefault DESC').all();
    
    results.push({ 
      step: 4, 
      action: "Verification", 
      status: "✅ Complete",
      count: count?.count || 0,
      templates: templates.results || []
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Initialize ALL - Completed in ${duration}ms`);

    return new Response(JSON.stringify({
      success: true,
      message: `🎉 초기화 완료! ${count?.count || 0}개 템플릿 설치됨`,
      duration: `${duration}ms`,
      results,
      templates: templates.results || []
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ Initialize ALL - Failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "초기화 실패",
      stack: error.stack,
      duration: `${duration}ms`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
.count || 0}개 템플릿 설치됨`,
      duration: `${duration}ms`,
      results,
      templates: templates.results || []
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ Initialize ALL - Failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "초기화 실패",
      stack: error.stack,
      duration: `${duration}ms`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
