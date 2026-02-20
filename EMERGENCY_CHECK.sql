-- ============================================================
-- 🚨 긴급: 실제 테이블 구조 확인 (복사하여 D1 Console에서 실행)
-- ============================================================

-- 1️⃣ 테이블 존재 확인
SELECT '=== 1. 테이블 목록 ===' as step;
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- 2️⃣ Academy 테이블이 있다면 스키마 확인
SELECT '=== 2. Academy 스키마 ===' as step;
PRAGMA table_info(Academy);

-- 3️⃣ academies 테이블이 있다면 스키마 확인  
SELECT '=== 3. academies 스키마 ===' as step;
PRAGMA table_info(academies);

-- 4️⃣ Academy 데이터 1개만 조회
SELECT '=== 4. Academy 데이터 샘플 ===' as step;
SELECT * FROM Academy LIMIT 1;

-- 5️⃣ academies 데이터 1개만 조회
SELECT '=== 5. academies 데이터 샘플 ===' as step;
SELECT * FROM academies LIMIT 1;

-- ============================================================
-- 📋 이 결과를 모두 복사하여 알려주세요!
-- 에러가 나는 부분도 포함해서 알려주시면 즉시 수정하겠습니다.
-- ============================================================
