-- ============================================
-- LandingPageTemplate 테이블 생성 SQL
-- ============================================
-- 이 SQL을 Cloudflare D1 콘솔에서 실행하세요
-- 위치: Cloudflare Dashboard > D1 > 해당 데이터베이스 > Console
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
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

-- 2️⃣ 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_landing_template_creator 
ON LandingPageTemplate(createdById);

CREATE INDEX IF NOT EXISTS idx_landing_template_default 
ON LandingPageTemplate(isDefault);

-- 3️⃣ 테이블 생성 확인
SELECT 
  name as table_name,
  sql as create_statement
FROM sqlite_master 
WHERE type='table' AND name='LandingPageTemplate';

-- 4️⃣ 인덱스 확인
SELECT 
  name as index_name,
  tbl_name as table_name,
  sql as create_statement
FROM sqlite_master 
WHERE type='index' AND tbl_name='LandingPageTemplate';

-- ============================================
-- ✅ 실행 후 확인사항
-- ============================================
-- 1. 테이블이 정상 생성되었는지 확인
-- 2. 두 개의 인덱스가 생성되었는지 확인
-- 3. https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates 접속
-- 4. 새 템플릿 생성 테스트
-- ============================================

-- 📋 테이블 구조 설명:
-- - id: 템플릿 고유 ID (template_xxxxx 형식)
-- - name: 템플릿 이름
-- - description: 템플릿 설명 (선택)
-- - html: HTML 템플릿 코드 ({{변수}} 포함)
-- - variables: JSON 배열 형태의 변수 목록
-- - isDefault: 기본 템플릿 여부 (0 또는 1)
-- - usageCount: 사용 횟수
-- - createdById: 생성자 User ID (FOREIGN KEY)
-- - createdAt: 생성 일시
-- - updatedAt: 수정 일시
-- ============================================
