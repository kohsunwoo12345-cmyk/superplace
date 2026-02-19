-- STEP 1: Create LandingPageTemplate table
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

CREATE INDEX IF NOT EXISTS idx_landing_template_creator ON LandingPageTemplate(createdById);
CREATE INDEX IF NOT EXISTS idx_landing_template_default ON LandingPageTemplate(isDefault);

-- STEP 2: Insert Template 1 - Student Growth Report
INSERT INTO LandingPageTemplate (id, name, description, html, variables, isDefault, usageCount, createdById, createdAt, updatedAt)
VALUES (
  'tpl_student_report_001',
  '🌟 학생 성장 리포트',
  '학생의 학습 성과와 성장을 보여주는 프리미엄 템플릿',
  '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>{{studentName}} 학생 리포트</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:20px}.container{max-width:800px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden}.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:40px;text-align:center}.header h1{font-size:36px;margin-bottom:10px}.header .period{font-size:18px;opacity:0.95}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;padding:30px}.stat-card{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:25px;border-radius:12px;text-align:center;box-shadow:0 4px 15px rgba(102,126,234,0.3)}.stat-value{font-size:42px;font-weight:bold;margin-bottom:8px}.stat-label{font-size:14px;opacity:0.9}.content{padding:30px}.section{margin-bottom:30px}.section-title{font-size:22px;font-weight:bold;color:#1f2937;margin-bottom:15px;padding-left:15px;border-left:4px solid #667eea}.comment-box{background:#f9fafb;padding:20px;border-radius:10px;border-left:4px solid #667eea;line-height:1.8;color:#374151}.footer{background:#f9fafb;padding:25px;text-align:center;border-top:1px solid #e5e7eb;color:#6b7280}.footer p{margin:5px 0;font-size:14px}</style></head><body><div class="container"><div class="header"><h1>🌟 {{studentName}} 학생 리포트</h1><div class="period">{{period}} 학습 성과 리포트</div></div><div class="stats"><div class="stat-card"><div class="stat-value">{{attendanceRate}}%</div><div class="stat-label">출석률</div></div><div class="stat-card"><div class="stat-value">{{homeworkRate}}%</div><div class="stat-label">과제 완성률</div></div><div class="stat-card"><div class="stat-value">{{avgScore}}점</div><div class="stat-label">평균 점수</div></div></div><div class="content"><div class="section"><div class="section-title">💬 선생님 코멘트</div><div class="comment-box">{{teacherComment}}</div></div></div><div class="footer"><p><strong>{{academyName}}</strong></p><p style="font-size:12px;margin-top:8px;color:#9ca3af">생성일: {{generatedDate}}</p></div></div></body></html>',
  '["studentName","period","attendanceRate","homeworkRate","avgScore","teacherComment","academyName","generatedDate"]',
  1,
  0,
  'system',
  datetime('now'),
  datetime('now')
);

-- STEP 3: Insert Template 2 - Modern Academy
INSERT INTO LandingPageTemplate (id, name, description, html, variables, isDefault, usageCount, createdById, createdAt, updatedAt)
VALUES (
  'tpl_academy_intro_001',
  '🎓 모던 학원 소개',
  '세련되고 전문적인 학원 소개 페이지',
  '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>{{academyName}}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}header{background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#fff;padding:80px 20px;text-align:center}header h1{font-size:52px;margin-bottom:15px;font-weight:bold}header p{font-size:20px;opacity:0.95}.container{max-width:1200px;margin:0 auto;padding:60px 20px}.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:30px;margin:50px 0}.feature-card{background:#fff;padding:35px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);transition:transform 0.3s,box-shadow 0.3s}.feature-card:hover{transform:translateY(-8px);box-shadow:0 8px 30px rgba(0,0,0,0.12)}.feature-icon{font-size:50px;margin-bottom:20px}.feature-title{font-size:22px;font-weight:bold;margin-bottom:12px;color:#1f2937}.feature-desc{color:#6b7280;line-height:1.7;font-size:15px}.cta{text-align:center;margin-top:60px;padding:40px 20px}.cta-button{display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#fff;padding:18px 50px;border-radius:50px;text-decoration:none;font-size:18px;font-weight:bold;box-shadow:0 4px 20px rgba(79,70,229,0.4);transition:transform 0.3s}.cta-button:hover{transform:scale(1.05)}</style></head><body><header><h1>{{academyName}}</h1><p>{{tagline}}</p></header><div class="container"><div class="features"><div class="feature-card"><div class="feature-icon">📚</div><div class="feature-title">체계적인 커리큘럼</div><div class="feature-desc">{{feature1}}</div></div><div class="feature-card"><div class="feature-icon">👨‍🏫</div><div class="feature-title">최고의 강사진</div><div class="feature-desc">{{feature2}}</div></div><div class="feature-card"><div class="feature-icon">🎯</div><div class="feature-title">맞춤형 학습관리</div><div class="feature-desc">{{feature3}}</div></div></div><div class="cta"><a href="#contact" class="cta-button">무료 상담 신청하기</a></div></div></body></html>',
  '["academyName","tagline","feature1","feature2","feature3"]',
  0,
  0,
  'system',
  datetime('now'),
  datetime('now')
);

-- STEP 4: Insert Template 3 - Event & Seminar
INSERT INTO LandingPageTemplate (id, name, description, html, variables, isDefault, usageCount, createdById, createdAt, updatedAt)
VALUES (
  'tpl_event_001',
  '🎉 이벤트 & 세미나',
  '특별 이벤트와 세미나 안내 페이지',
  '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>{{eventTitle}}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:linear-gradient(135deg,#ff6b6b 0%,#ee5a6f 100%);color:#fff;min-height:100vh}.container{max-width:900px;margin:0 auto;padding:60px 20px;text-align:center}.badge{display:inline-block;background:rgba(255,255,255,0.25);padding:10px 25px;border-radius:25px;font-size:15px;margin-bottom:25px;font-weight:bold}h1{font-size:56px;margin-bottom:20px;text-shadow:2px 2px 8px rgba(0,0,0,0.3);font-weight:bold}.date{font-size:26px;margin:25px 0;opacity:0.95;font-weight:500}.description{font-size:19px;line-height:1.9;margin:35px auto;max-width:700px;background:rgba(255,255,255,0.15);padding:35px;border-radius:15px;backdrop-filter:blur(10px)}.highlights{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:25px;margin:50px 0}.highlight{background:rgba(255,255,255,0.2);padding:30px;border-radius:15px;backdrop-filter:blur(10px)}.highlight-icon{font-size:42px;margin-bottom:15px}.highlight-text{font-size:16px;font-weight:500}.register{margin-top:50px}.register-btn{display:inline-block;background:#fff;color:#ff6b6b;padding:18px 55px;border-radius:50px;text-decoration:none;font-size:19px;font-weight:bold;box-shadow:0 6px 25px rgba(0,0,0,0.3);transition:transform 0.3s}.register-btn:hover{transform:scale(1.05)}</style></head><body><div class="container"><div class="badge">✨ 특별 이벤트</div><h1>{{eventTitle}}</h1><div class="date">📅 {{eventDate}} {{eventTime}}</div><div class="description">{{description}}</div><div class="highlights"><div class="highlight"><div class="highlight-icon">🎁</div><div class="highlight-text">{{benefit1}}</div></div><div class="highlight"><div class="highlight-icon">⭐</div><div class="highlight-text">{{benefit2}}</div></div><div class="highlight"><div class="highlight-icon">🚀</div><div class="highlight-text">{{benefit3}}</div></div></div><div class="register"><a href="#register" class="register-btn">지금 신청하기 →</a></div></div></body></html>',
  '["eventTitle","eventDate","eventTime","description","benefit1","benefit2","benefit3"]',
  0,
  0,
  'system',
  datetime('now'),
  datetime('now')
);

-- STEP 5: Insert Template 4 - Free Trial
INSERT INTO LandingPageTemplate (id, name, description, html, variables, isDefault, usageCount, createdById, createdAt, updatedAt)
VALUES (
  'tpl_free_trial_001',
  '🚀 무료 체험 신청',
  '무료 체험 수업 신청을 위한 전환 최적화 페이지',
  '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>무료 체험 신청</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f3f4f6}.hero{background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;padding:100px 20px;text-align:center}.urgency{background:#fbbf24;color:#92400e;display:inline-block;padding:10px 25px;border-radius:25px;font-weight:bold;margin-bottom:25px;font-size:15px}h1{font-size:54px;margin-bottom:20px;text-shadow:2px 2px 6px rgba(0,0,0,0.2);font-weight:bold}.subtitle{font-size:24px;opacity:0.95}.container{max-width:1100px;margin:-80px auto 0;position:relative;z-index:1;padding:0 20px}.benefits{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:25px;margin-bottom:50px}.benefit-card{background:#fff;padding:35px;border-radius:16px;box-shadow:0 6px 25px rgba(0,0,0,0.1);transition:transform 0.3s}.benefit-card:hover{transform:translateY(-5px)}.benefit-icon{font-size:52px;margin-bottom:18px}.benefit-title{font-size:20px;font-weight:bold;margin-bottom:10px;color:#1f2937}.benefit-desc{color:#6b7280;line-height:1.7;font-size:15px}.cta-section{background:#fff;padding:50px 40px;border-radius:16px;box-shadow:0 6px 25px rgba(0,0,0,0.1);text-align:center}.cta-title{font-size:36px;color:#1f2937;margin-bottom:25px;font-weight:bold}.cta-button{display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;padding:20px 65px;border-radius:50px;text-decoration:none;font-size:20px;font-weight:bold;box-shadow:0 6px 20px rgba(16,185,129,0.4);transition:transform 0.3s}.cta-button:hover{transform:scale(1.05)}</style></head><body><div class="hero"><div class="urgency">⏰ 이번 주 한정 특별 혜택!</div><h1>지금 무료로 체험하세요!</h1><div class="subtitle">{{subtitle}}</div></div><div class="container"><div class="benefits"><div class="benefit-card"><div class="benefit-icon">✅</div><div class="benefit-title">첫 수업 무료</div><div class="benefit-desc">{{benefit1}}</div></div><div class="benefit-card"><div class="benefit-icon">🎯</div><div class="benefit-title">맞춤 학습 진단</div><div class="benefit-desc">{{benefit2}}</div></div><div class="benefit-card"><div class="benefit-icon">💰</div><div class="benefit-title">특별 할인</div><div class="benefit-desc">{{benefit3}}</div></div></div><div class="cta-section"><div class="cta-title">단 3분이면 신청 완료!</div><a href="#form" class="cta-button">무료 체험 신청하기 →</a></div></div></body></html>',
  '["subtitle","benefit1","benefit2","benefit3"]',
  0,
  0,
  'system',
  datetime('now'),
  datetime('now')
);

-- STEP 6: Insert Template 5 - Parent Community
INSERT INTO LandingPageTemplate (id, name, description, html, variables, isDefault, usageCount, createdById, createdAt, updatedAt)
VALUES (
  'tpl_community_001',
  '👥 학부모 커뮤니티',
  '학부모 소통과 참여를 위한 커뮤니티 페이지',
  '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>학부모 커뮤니티</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f9fafb}.header{background:linear-gradient(135deg,#14b8a6 0%,#0891b2 100%);color:#fff;padding:80px 20px;text-align:center}h1{font-size:48px;margin-bottom:18px;font-weight:bold}.tagline{font-size:22px;opacity:0.95}.container{max-width:1200px;margin:0 auto;padding:70px 20px}.intro{text-align:center;max-width:850px;margin:0 auto 70px}.intro-text{font-size:19px;line-height:1.9;color:#4b5563}.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:30px;margin:70px 0}.feature{background:#fff;padding:35px;border-radius:16px;box-shadow:0 4px 15px rgba(0,0,0,0.06);border-top:5px solid #14b8a6;transition:transform 0.3s}.feature:hover{transform:translateY(-5px)}.feature-icon{font-size:45px;margin-bottom:18px}.feature-title{font-size:21px;font-weight:bold;margin-bottom:12px;color:#1f2937}.feature-desc{color:#6b7280;line-height:1.7;font-size:15px}.join-section{background:#fff;padding:70px 40px;border-radius:16px;box-shadow:0 6px 25px rgba(0,0,0,0.1);text-align:center;margin-top:70px}.join-title{font-size:38px;color:#1f2937;margin-bottom:18px;font-weight:bold}.join-desc{font-size:19px;color:#6b7280;margin-bottom:35px}.join-button{display:inline-block;background:linear-gradient(135deg,#14b8a6 0%,#0891b2 100%);color:#fff;padding:18px 55px;border-radius:50px;text-decoration:none;font-size:19px;font-weight:bold;box-shadow:0 6px 20px rgba(20,184,166,0.4);transition:transform 0.3s}.join-button:hover{transform:scale(1.05)}</style></head><body><div class="header"><h1>{{communityName}}</h1><div class="tagline">{{tagline}}</div></div><div class="container"><div class="intro"><div class="intro-text">{{introText}}</div></div><div class="features"><div class="feature"><div class="feature-icon">💬</div><div class="feature-title">소통 공간</div><div class="feature-desc">{{feature1}}</div></div><div class="feature"><div class="feature-icon">📚</div><div class="feature-title">교육 정보</div><div class="feature-desc">{{feature2}}</div></div><div class="feature"><div class="feature-icon">📅</div><div class="feature-title">일정 공유</div><div class="feature-desc">{{feature3}}</div></div><div class="feature"><div class="feature-icon">🎯</div><div class="feature-title">상담 예약</div><div class="feature-desc">{{feature4}}</div></div></div><div class="join-section"><div class="join-title">함께 성장하는 커뮤니티</div><div class="join-desc">지금 가입하고 다양한 혜택을 누리세요</div><a href="#join" class="join-button">커뮤니티 가입하기 →</a></div></div></body></html>',
  '["communityName","tagline","introText","feature1","feature2","feature3","feature4"]',
  0,
  0,
  'system',
  datetime('now'),
  datetime('now')
);
