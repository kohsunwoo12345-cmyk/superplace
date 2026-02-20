-- ============================================================
-- 🔬 실제 테이블 구조 완전 분석 SQL
-- ============================================================
-- Cloudflare D1 Console에서 순서대로 실행하세요
-- ============================================================

-- 1️⃣ 모든 테이블 목록
SELECT '=== 1. 모든 테이블 ===' as step;
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- 2️⃣ Academy/academies 테이블 스키마 (정확한 컬럼명 확인)
SELECT '=== 2. Academy 테이블 스키마 ===' as step;
PRAGMA table_info(Academy);

-- 만약 위가 에러나면 아래 시도
SELECT '=== 2-2. academies 테이블 스키마 ===' as step;
PRAGMA table_info(academies);

-- 3️⃣ User/users 테이블 스키마
SELECT '=== 3. User 테이블 스키마 ===' as step;
PRAGMA table_info(User);

-- 만약 위가 에러나면 아래 시도
SELECT '=== 3-2. users 테이블 스키마 ===' as step;
PRAGMA table_info(users);

-- 4️⃣ 실제 데이터 샘플 확인 (테이블명 수정 필요)
SELECT '=== 4. Academy 데이터 샘플 ===' as step;
SELECT * FROM Academy LIMIT 3;

-- 만약 위가 에러나면 아래 시도
SELECT '=== 4-2. academies 데이터 샘플 ===' as step;
SELECT * FROM academies LIMIT 3;

-- 5️⃣ 학원 개수 확인
SELECT '=== 5. 학원 개수 ===' as step;
SELECT COUNT(*) as total FROM Academy;

-- 만약 위가 에러나면 아래 시도
SELECT '=== 5-2. 학원 개수 ===' as step;
SELECT COUNT(*) as total FROM academies;

-- ============================================================
-- 📋 결과를 복사하여 알려주세요!
-- ============================================================
-- 특히 중요한 것:
-- 1. 테이블 이름 (Academy? academies?)
-- 2. 컬럼 이름들 (name? academy_name? ...)
-- 3. 실제 데이터가 있는지 (COUNT 결과)
-- ============================================================
