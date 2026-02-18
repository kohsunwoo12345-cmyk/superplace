-- ============================================
-- 긴급: 템플릿 직접 생성 SQL (짧은 버전)
-- ============================================
-- D1 Console에서 바로 실행 가능
-- ============================================

-- 1️⃣ 먼저 기존 확인
SELECT COUNT(*) as template_count FROM LandingPageTemplate;

-- 2️⃣ User 테이블에 admin 확인 (없으면 추가)
INSERT OR IGNORE INTO User (id, email, name, role, password, createdAt, updatedAt)
VALUES ('1', 'admin@superplace.com', 'System Admin', 'SUPER_ADMIN', 'hashed_password', datetime('now'), datetime('now'));

-- 3️⃣ 기존 템플릿 삭제 (있다면)
DELETE FROM LandingPageTemplate WHERE id = 'template_simple_v1';

-- 4️⃣ 간단한 테스트 템플릿 삽입
INSERT INTO LandingPageTemplate (
  id,
  name,
  description,
  html,
  variables,
  isDefault,
  usageCount,
  createdById,
  createdAt,
  updatedAt
) VALUES (
  'template_simple_v1',
  '간단한 테스트 템플릿',
  '기본적인 학생 리포트 템플릿입니다.',
  '<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>{{studentName}} 학생 리포트</title>
  <style>
    body {
      font-family: sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 10px;
    }
    h1 { margin: 0; font-size: 32px; }
    .info { margin: 20px 0; }
    .info-item { padding: 10px; background: #f9f9f9; margin: 10px 0; border-radius: 5px; }
    .label { font-weight: bold; color: #667eea; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{studentName}} 학생의 학습 리포트</h1>
    <p>기간: {{period}}</p>
  </div>
  <div class="content">
    <div class="info">
      <div class="info-item">
        <span class="label">출석률:</span> {{attendanceRate}}
      </div>
      <div class="info-item">
        <span class="label">AI 대화:</span> {{aiChatCount}}회
      </div>
      <div class="info-item">
        <span class="label">숙제 완료율:</span> {{homeworkRate}}
      </div>
    </div>
    <p>{{studentName}} 학생은 이번 {{period}} 기간 동안 성실하게 학습에 참여했습니다.</p>
  </div>
</body>
</html>',
  '["studentName","period","attendanceRate","aiChatCount","homeworkRate"]',
  1,
  0,
  '1',
  datetime('now'),
  datetime('now')
);

-- 5️⃣ 삽입 확인
SELECT id, name, description, isDefault, LENGTH(html) as html_length, createdAt 
FROM LandingPageTemplate 
WHERE id = 'template_simple_v1';

-- 6️⃣ 모든 템플릿 목록
SELECT id, name, isDefault, usageCount FROM LandingPageTemplate;
