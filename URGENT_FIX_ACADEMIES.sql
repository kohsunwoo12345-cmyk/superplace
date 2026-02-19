-- ============================================================
-- 🚨 긴급: 학원 0개 문제 해결을 위한 즉시 실행 SQL
-- ============================================================
-- Cloudflare D1 Console에서 아래 쿼리를 순서대로 실행하고
-- 각 결과를 복사하여 알려주세요!
-- ============================================================

-- 1️⃣ 테이블 목록 확인
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- 2️⃣ Academy 테이블 구조 확인 (에러나면 SKIP)
SELECT sql FROM sqlite_master WHERE type='table' AND name='Academy';

-- 3️⃣ academies 테이블 구조 확인 (에러나면 SKIP)
SELECT sql FROM sqlite_master WHERE type='table' AND name='academies';

-- 4️⃣ Academy 컬럼 목록 (에러나면 SKIP)
PRAGMA table_info(Academy);

-- 5️⃣ academies 컬럼 목록 (에러나면 SKIP)
PRAGMA table_info(academies);

-- 6️⃣ Academy 데이터 개수 (에러나면 SKIP)
SELECT COUNT(*) as total FROM Academy;

-- 7️⃣ academies 데이터 개수 (에러나면 SKIP)
SELECT COUNT(*) as total FROM academies;

-- 8️⃣ Academy 실제 데이터 1개 (에러나면 SKIP)
SELECT * FROM Academy LIMIT 1;

-- 9️⃣ academies 실제 데이터 1개 (에러나면 SKIP)
SELECT * FROM academies LIMIT 1;

-- 🔟 User/users 테이블 확인
SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%User%' OR name LIKE '%user%');

-- ============================================================
-- 📋 위 결과를 모두 복사해서 알려주세요!
-- 에러가 나는 부분도 "에러: ..." 형태로 알려주시면
-- 즉시 정확한 해결책을 제시하겠습니다!
-- ============================================================
