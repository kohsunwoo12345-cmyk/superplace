-- ================================================
-- 🎯 D1 Console에서 실행할 SQL
-- ================================================
-- 복사해서 Cloudflare D1 Console에 붙여넣으세요!
-- ================================================

-- 1. 기존 테이블이 있다면 확인
SELECT name FROM sqlite_master WHERE type='table';

-- 2. users 테이블의 현재 구조 확인
PRAGMA table_info(users);

-- 3. academyId 컬럼이 없다면 추가
ALTER TABLE users ADD COLUMN academyId TEXT;

-- 4. 확인
PRAGMA table_info(users);

-- 5. 테스트 쿼리 (에러 없이 실행되어야 함)
SELECT id, email, name, role, academyId FROM users LIMIT 5;
