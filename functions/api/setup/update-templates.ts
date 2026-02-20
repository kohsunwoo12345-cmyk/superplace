// Cloudflare Pages Function - Update templates with detailed improvement tracking
// POST /api/setup/update-templates

interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body = await context.request.json();
    const { password } = body;
    
    if (password !== "setup-templates-2026") {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = context.env.DB;

    // Delete old template
    await db.prepare(`DELETE FROM LandingPageTemplate WHERE id = 'tpl_student_report_001'`).run();

    // Insert NEW detailed student report template
    const detailedTemplate = {
      id: 'tpl_student_report_detailed_001',
      name: '🌟 학생 성장 상세 리포트',
      description: '학생의 문제점, 개선 과정, 결과까지 모두 보여주는 상세 템플릿',
      html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{studentName}} 학생 성장 리포트</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans KR',system-ui;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:20px}
.container{max-width:900px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.2);overflow:hidden}
.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:40px;text-align:center}
.header h1{font-size:32px;margin-bottom:8px}
.header .period{font-size:18px;opacity:.9}
.content{padding:40px}
.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:30px 0}
.stat-card{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:24px;border-radius:12px;text-align:center}
.stat-value{font-size:40px;font-weight:700;margin-bottom:8px}
.stat-label{font-size:14px;opacity:.9}
.section{margin:40px 0;padding:30px;background:#f9fafb;border-radius:12px}
.section-title{font-size:24px;font-weight:700;color:#1f2937;margin-bottom:20px;padding-left:16px;border-left:4px solid #667eea}
.problem-box{background:#fee2e2;border-left:4px solid #ef4444;padding:20px;border-radius:8px;margin-bottom:20px}
.problem-title{font-size:18px;font-weight:700;color:#991b1b;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.problem-content{color:#7f1d1d;line-height:1.8;font-size:15px}
.process-box{background:#dbeafe;border-left:4px solid #3b82f6;padding:20px;border-radius:8px;margin-bottom:20px}
.process-title{font-size:18px;font-weight:700;color:#1e40af;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.process-step{margin:12px 0;padding-left:24px;position:relative}
.process-step::before{content:'✓';position:absolute;left:0;color:#3b82f6;font-weight:700;font-size:18px}
.process-content{color:#1e3a8a;line-height:1.8;font-size:15px}
.result-box{background:#d1fae5;border-left:4px solid #10b981;padding:20px;border-radius:8px}
.result-title{font-size:18px;font-weight:700;color:#065f46;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.result-content{color:#064e3b;line-height:1.8;font-size:15px}
.improvement-metric{display:flex;justify-content:space-between;align-items:center;margin:16px 0;padding:16px;background:#fff;border-radius:8px}
.metric-label{font-size:15px;font-weight:600;color:#374151}
.metric-change{display:flex;align-items:center;gap:8px}
.metric-before{color:#ef4444;font-weight:700}
.metric-arrow{color:#6b7280;font-size:20px}
.metric-after{color:#10b981;font-weight:700;font-size:18px}
.comment-box{background:#fff;padding:24px;border-radius:8px;border:2px solid #e5e7eb;line-height:1.8;color:#374151;font-size:15px}
.footer{text-align:center;padding:30px;background:#f9fafb;color:#6b7280;font-size:14px}
.footer strong{color:#1f2937}
@media(max-width:768px){
.stat-grid{grid-template-columns:1fr}
.improvement-metric{flex-direction:column;gap:8px;text-align:center}
}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🌟 {{studentName}} 학생 성장 리포트</h1>
    <div class="period">{{period}}</div>
  </div>
  
  <div class="content">
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">{{attendanceRate}}%</div>
        <div class="stat-label">출석률</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{homeworkRate}}%</div>
        <div class="stat-label">과제 완성률</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{avgScore}}점</div>
        <div class="stat-label">평균 점수</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">🔍 발견된 문제점</div>
      <div class="problem-box">
        <div class="problem-title">
          <span>⚠️</span> 주요 문제
        </div>
        <div class="problem-content">{{problemDescription}}</div>
      </div>
      <div class="improvement-metric">
        <span class="metric-label">문제 발생 빈도</span>
        <div class="metric-change">
          <span class="metric-before">{{problemFrequency}}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">💡 개선 과정</div>
      <div class="process-box">
        <div class="process-title">
          <span>🎯</span> 실행한 개선 방법
        </div>
        <div class="process-step">
          <div class="process-content"><strong>1단계:</strong> {{improvementStep1}}</div>
        </div>
        <div class="process-step">
          <div class="process-content"><strong>2단계:</strong> {{improvementStep2}}</div>
        </div>
        <div class="process-step">
          <div class="process-content"><strong>3단계:</strong> {{improvementStep3}}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">📈 개선 결과</div>
      <div class="result-box">
        <div class="result-title">
          <span>✅</span> 달성한 성과
        </div>
        <div class="result-content">{{achievementDescription}}</div>
      </div>
      
      <div class="improvement-metric">
        <span class="metric-label">점수 변화</span>
        <div class="metric-change">
          <span class="metric-before">{{scoreBefore}}점</span>
          <span class="metric-arrow">→</span>
          <span class="metric-after">{{scoreAfter}}점</span>
        </div>
      </div>
      
      <div class="improvement-metric">
        <span class="metric-label">이해도 변화</span>
        <div class="metric-change">
          <span class="metric-before">{{understandingBefore}}%</span>
          <span class="metric-arrow">→</span>
          <span class="metric-after">{{understandingAfter}}%</span>
        </div>
      </div>

      <div class="improvement-metric">
        <span class="metric-label">학습 태도</span>
        <div class="metric-change">
          <span class="metric-before">{{attitudeBefore}}</span>
          <span class="metric-arrow">→</span>
          <span class="metric-after">{{attitudeAfter}}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">💬 선생님 총평</div>
      <div class="comment-box">{{teacherComment}}</div>
    </div>
  </div>

  <div class="footer">
    <p><strong>{{academyName}}</strong>에서 제공하는 학습 리포트입니다.</p>
    <p style="margin-top:12px">생성일: {{generatedDate}}</p>
  </div>
</div>
</body></html>`,
      variables: JSON.stringify([
        "studentName", "period", "attendanceRate", "homeworkRate", "avgScore",
        "problemDescription", "problemFrequency",
        "improvementStep1", "improvementStep2", "improvementStep3",
        "achievementDescription",
        "scoreBefore", "scoreAfter",
        "understandingBefore", "understandingAfter",
        "attitudeBefore", "attitudeAfter",
        "teacherComment", "academyName", "generatedDate"
      ]),
      isDefault: 1
    };

    await db.prepare(`
      INSERT OR REPLACE INTO LandingPageTemplate (
        id, name, description, html, variables, isDefault, usageCount, createdById, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 'system', datetime('now'), datetime('now'))
    `).bind(
      detailedTemplate.id,
      detailedTemplate.name,
      detailedTemplate.description,
      detailedTemplate.html,
      detailedTemplate.variables,
      detailedTemplate.isDefault
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: "상세 학생 리포트 템플릿 업데이트 완료",
      template: detailedTemplate
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Template update failed:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
