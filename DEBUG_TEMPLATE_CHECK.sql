-- ============================================
-- 템플릿 삽입 확인 및 디버깅 SQL
-- ============================================
-- Cloudflare D1 Console에서 실행
-- ============================================

-- 1️⃣ 템플릿 테이블 존재 확인
SELECT name, sql FROM sqlite_master 
WHERE type='table' AND name='LandingPageTemplate';

-- 2️⃣ 모든 템플릿 조회 (간단 버전)
SELECT id, name, description, isDefault, usageCount, createdAt 
FROM LandingPageTemplate;

-- 3️⃣ 템플릿 개수 확인
SELECT COUNT(*) as total_templates FROM LandingPageTemplate;

-- 4️⃣ 특정 템플릿 상세 조회
SELECT 
  id, 
  name, 
  description,
  LENGTH(html) as html_length,
  variables,
  isDefault,
  usageCount,
  createdById,
  createdAt,
  updatedAt
FROM LandingPageTemplate 
WHERE name = '학생 성장 리포트 v1.0';

-- 5️⃣ User 테이블 확인 (createdById 검증)
SELECT id, email, name, role FROM User WHERE id = '1';

-- 6️⃣ 템플릿이 없다면 다시 삽입 (간단 버전)
-- 주의: 이미 있다면 에러 발생 (중복 방지)
INSERT OR REPLACE INTO LandingPageTemplate (
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
  'template_growth_report_v1',
  '학생 성장 리포트 v1.0',
  '상세한 성장 일기 형식의 학생 학습 리포트. 출석, AI 학습, 숙제 현황을 아름다운 디자인으로 표현합니다.',
  '<html>테스트용 간단 템플릿</html>',
  '["studentName","period"]',
  1,
  0,
  '1',
  datetime('now'),
  datetime('now')
);

-- 7️⃣ 다시 확인
SELECT id, name, LENGTH(html) as html_length FROM LandingPageTemplate;

-- ============================================
-- 💡 예상되는 문제들
-- ============================================

-- 문제 1: User 테이블에 id='1' 없음
-- 해결:
INSERT OR IGNORE INTO User (id, email, name, role, password, createdAt, updatedAt)
VALUES ('1', 'admin@superplace.com', 'Admin User', 'SUPER_ADMIN', 'temp_password', datetime('now'), datetime('now'));

-- 문제 2: 템플릿이 전혀 없음
-- 해결: 위의 6️⃣ 실행

-- 문제 3: HTML이 너무 길어서 삽입 실패
-- 해결: Wrangler CLI 사용하거나 웹 UI에서 직접 생성

-- ============================================
-- 🔍 API 응답 테스트용 쿼리
-- ============================================

-- 실제 API가 실행하는 쿼리와 동일
SELECT 
  t.id,
  t.name,
  t.description,
  t.html,
  t.variables,
  t.isDefault,
  t.createdAt,
  t.updatedAt,
  u.name as creatorName,
  (SELECT COUNT(*) FROM LandingPage WHERE templateId = t.id) as actualUsageCount
FROM LandingPageTemplate t
LEFT JOIN User u ON t.createdById = u.id
ORDER BY t.isDefault DESC, t.createdAt DESC;
