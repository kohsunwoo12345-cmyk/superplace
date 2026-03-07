-- ============================================
-- 랜딩페이지 테이블 복구 SQL
-- Cloudflare D1 콘솔에서 실행
-- ============================================

-- 1️⃣ slug 컬럼 추가 (없는 경우만)
ALTER TABLE landing_pages ADD COLUMN slug TEXT;

-- 2️⃣ 기존 데이터에 slug 값 설정 (NULL인 경우)
UPDATE landing_pages 
SET slug = 'lp-' || id 
WHERE slug IS NULL OR slug = '';

-- 3️⃣ slug 컬럼에 UNIQUE 인덱스 추가
CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);

-- 4️⃣ 확인 쿼리
SELECT id, slug, title, created_at FROM landing_pages ORDER BY created_at DESC LIMIT 5;

-- 5️⃣ 테이블 스키마 확인
PRAGMA table_info(landing_pages);
