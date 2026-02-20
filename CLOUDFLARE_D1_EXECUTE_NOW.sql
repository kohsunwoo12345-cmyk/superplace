-- ============================================
-- 🚨 긴급 실행 SQL - Cloudflare D1 콘솔에서 바로 실행하세요
-- ============================================
-- 실행 위치: Cloudflare Dashboard → D1 → 데이터베이스 선택 → Console 탭
-- ============================================

-- 1️⃣ LandingPageTemplate 테이블 생성
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

-- 2️⃣ 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_landing_template_creator ON LandingPageTemplate(createdById);
CREATE INDEX IF NOT EXISTS idx_landing_template_default ON LandingPageTemplate(isDefault);

-- 3️⃣ 상세 학생 리포트 템플릿 삽입
INSERT OR REPLACE INTO LandingPageTemplate (
  id, name, description, html, variables, isDefault, usageCount, createdById, createdAt, updatedAt
) VALUES (
  'tpl_student_report_detailed_001',
  '🌟 학생 성장 상세 리포트',
  '학생의 문제점, 개선 과정, 결과까지 모두 보여주는 상세 템플릿',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{studentName}} 학생 성장 리포트</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:''Noto Sans KR'',system-ui;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:20px}.container{max-width:900px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.2);overflow:hidden}.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:40px;text-align:center}.header h1{font-size:32px;margin-bottom:8px}.header .period{font-size:18px;opacity:.9}.content{padding:40px}.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:30px 0}.stat-card{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:24px;border-radius:12px;text-align:center}.stat-value{font-size:40px;font-weight:700;margin-bottom:8px}.stat-label{font-size:14px;opacity:.9}.section{margin:40px 0;padding:30px;background:#f9fafb;border-radius:12px}.section-title{font-size:24px;font-weight:700;color:#1f2937;margin-bottom:20px;padding-left:16px;border-left:4px solid #667eea}.problem-box{background:#fee2e2;border-left:4px solid #ef4444;padding:20px;border-radius:8px;margin-bottom:20px}.problem-title{font-size:18px;font-weight:700;color:#991b1b;margin-bottom:12px;display:flex;align-items:center;gap:8px}.problem-content{color:#7f1d1d;line-height:1.8;font-size:15px}.process-box{background:#dbeafe;border-left:4px solid #3b82f6;padding:20px;border-radius:8px;margin-bottom:20px}.process-title{font-size:18px;font-weight:700;color:#1e40af;margin-bottom:16px;display:flex;align-items:center;gap:8px}.process-step{margin:12px 0;padding-left:24px;position:relative}.process-step::before{content:''✓'';position:absolute;left:0;color:#3b82f6;font-weight:700;font-size:18px}.process-content{color:#1e3a8a;line-height:1.8;font-size:15px}.result-box{background:#d1fae5;border-left:4px solid #10b981;padding:20px;border-radius:8px}.result-title{font-size:18px;font-weight:700;color:#065f46;margin-bottom:12px;display:flex;align-items:center;gap:8px}.result-content{color:#064e3b;line-height:1.8;font-size:15px}.improvement-metric{display:flex;justify-content:space-between;align-items:center;margin:16px 0;padding:16px;background:#fff;border-radius:8px}.metric-label{font-size:15px;font-weight:600;color:#374151}.metric-change{display:flex;align-items:center;gap:8px}.metric-before{color:#ef4444;font-weight:700}.metric-arrow{color:#6b7280;font-size:20px}.metric-after{color:#10b981;font-weight:700;font-size:18px}.comment-box{background:#fff;padding:24px;border-radius:8px;border:2px solid #e5e7eb;line-height:1.8;color:#374151;font-size:15px}.footer{text-align:center;padding:30px;background:#f9fafb;color:#6b7280;font-size:14px}.footer strong{color:#1f2937}@media(max-width:768px){.stat-grid{grid-template-columns:1fr}.improvement-metric{flex-direction:column;gap:8px;text-align:center}}</style></head><body><div class="container"><div class="header"><h1>🌟 {{studentName}} 학생 성장 리포트</h1><div class="period">{{period}}</div></div><div class="content"><div class="stat-grid"><div class="stat-card"><div class="stat-value">{{attendanceRate}}%</div><div class="stat-label">출석률</div></div><div class="stat-card"><div class="stat-value">{{homeworkRate}}%</div><div class="stat-label">과제 완성률</div></div><div class="stat-card"><div class="stat-value">{{avgScore}}점</div><div class="stat-label">평균 점수</div></div></div><div class="section"><div class="section-title">🔍 발견된 문제점</div><div class="problem-box"><div class="problem-title"><span>⚠️</span> 주요 문제</div><div class="problem-content">{{problemDescription}}</div></div><div class="improvement-metric"><span class="metric-label">문제 발생 빈도</span><div class="metric-change"><span class="metric-before">{{problemFrequency}}</span></div></div></div><div class="section"><div class="section-title">💡 개선 과정</div><div class="process-box"><div class="process-title"><span>🎯</span> 실행한 개선 방법</div><div class="process-step"><div class="process-content"><strong>1단계:</strong> {{improvementStep1}}</div></div><div class="process-step"><div class="process-content"><strong>2단계:</strong> {{improvementStep2}}</div></div><div class="process-step"><div class="process-content"><strong>3단계:</strong> {{improvementStep3}}</div></div></div></div><div class="section"><div class="section-title">📈 개선 결과</div><div class="result-box"><div class="result-title"><span>✅</span> 달성한 성과</div><div class="result-content">{{achievementDescription}}</div></div><div class="improvement-metric"><span class="metric-label">점수 변화</span><div class="metric-change"><span class="metric-before">{{scoreBefore}}점</span><span class="metric-arrow">→</span><span class="metric-after">{{scoreAfter}}점</span></div></div><div class="improvement-metric"><span class="metric-label">이해도 변화</span><div class="metric-change"><span class="metric-before">{{understandingBefore}}%</span><span class="metric-arrow">→</span><span class="metric-after">{{understandingAfter}}%</span></div></div><div class="improvement-metric"><span class="metric-label">학습 태도</span><div class="metric-change"><span class="metric-before">{{attitudeBefore}}</span><span class="metric-arrow">→</span><span class="metric-after">{{attitudeAfter}}</span></div></div></div><div class="section"><div class="section-title">💬 선생님 총평</div><div class="comment-box">{{teacherComment}}</div></div></div><div class="footer"><p><strong>{{academyName}}</strong>에서 제공하는 학습 리포트입니다.</p><p style="margin-top:12px">생성일: {{generatedDate}}</p></div></div></body></html>',
  '["studentName","period","attendanceRate","homeworkRate","avgScore","problemDescription","problemFrequency","improvementStep1","improvementStep2","improvementStep3","achievementDescription","scoreBefore","scoreAfter","understandingBefore","understandingAfter","attitudeBefore","attitudeAfter","teacherComment","academyName","generatedDate"]',
  1,
  0,
  'system',
  datetime('now'),
  datetime('now')
);

-- 4️⃣ 기본 학생 리포트 템플릿 삽입
INSERT OR REPLACE INTO LandingPageTemplate (
  id, name, description, html, variables, isDefault, usageCount, createdById, createdAt, updatedAt
) VALUES (
  'tpl_student_report_001',
  '🌟 학생 성장 리포트',
  '학생의 학습 성과와 성장을 보여주는 프리미엄 템플릿',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{studentName}} 학생 리포트</title><style>body{font-family:system-ui;max-width:800px;margin:0 auto;padding:20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}.container{background:#fff;padding:40px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.1)}h1{color:#667eea;font-size:32px;margin-bottom:8px}.subtitle{color:#6b7280;font-size:18px;margin-bottom:30px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:30px 0}.stat-card{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:20px;border-radius:8px;text-align:center}.stat-value{font-size:36px;font-weight:700}.stat-label{font-size:14px;opacity:.9;margin-top:8px}.section{margin:30px 0}.section-title{font-size:20px;font-weight:700;color:#111827;margin-bottom:16px;border-left:4px solid #667eea;padding-left:12px}.comment{background:#f9fafb;padding:20px;border-radius:8px;border-left:4px solid #667eea;line-height:1.6}footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280}</style></head><body><div class="container"><h1>🌟 {{studentName}} 학생 리포트</h1><div class="subtitle">{{period}} 학습 성과 리포트</div><div class="stats"><div class="stat-card"><div class="stat-value">{{attendanceRate}}%</div><div class="stat-label">출석률</div></div><div class="stat-card"><div class="stat-value">{{homeworkRate}}%</div><div class="stat-label">과제 완성률</div></div><div class="stat-card"><div class="stat-value">{{avgScore}}점</div><div class="stat-label">평균 점수</div></div></div><div class="section"><div class="section-title">💬 선생님 코멘트</div><div class="comment">{{teacherComment}}</div></div><footer><p>이 리포트는 {{academyName}}에서 제공합니다.</p><p style="font-size:12px;margin-top:8px">생성일: {{generatedDate}}</p></footer></div></body></html>',
  '["studentName","period","attendanceRate","homeworkRate","avgScore","teacherComment","academyName","generatedDate"]',
  0,
  0,
  'system',
  datetime('now'),
  datetime('now')
);

-- 5️⃣ 확인 쿼리
SELECT COUNT(*) as template_count FROM LandingPageTemplate;
SELECT id, name, isDefault FROM LandingPageTemplate ORDER BY isDefault DESC, createdAt ASC;

-- ============================================
-- ✅ 실행 완료 후:
-- 1. template_count = 2 이상이어야 함
-- 2. 페이지 새로고침 (Ctrl+Shift+R)
-- 3. /dashboard/admin/landing-pages/templates 접속
-- ============================================
