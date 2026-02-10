-- ============================================
-- D1 데이터베이스 스키마 확인 SQL
-- ============================================
-- Cloudflare D1 콘솔에서 실행하세요

-- 1. 모든 테이블 목록 확인
SELECT '=== 모든 테이블 목록 ===' as info;
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- 2. classes 테이블 구조 확인
SELECT '=== classes 테이블 구조 ===' as info;
PRAGMA table_info(classes);

-- 3. class_students 테이블 구조 확인
SELECT '=== class_students 테이블 구조 ===' as info;
PRAGMA table_info(class_students);

-- 4. class_schedules 테이블 구조 확인 (있는 경우)
SELECT '=== class_schedules 테이블 구조 ===' as info;
PRAGMA table_info(class_schedules);

-- 5. users 테이블 구조 확인
SELECT '=== users 테이블 구조 ===' as info;
PRAGMA table_info(users);

-- 6. academies 테이블 구조 확인
SELECT '=== academies 테이블 구조 ===' as info;
PRAGMA table_info(academies);

-- 7. 샘플 데이터 확인
SELECT '=== classes 테이블 샘플 데이터 (최대 3개) ===' as info;
SELECT * FROM classes LIMIT 3;

SELECT '=== users 테이블 샘플 데이터 (최대 3개, STUDENT만) ===' as info;
SELECT id, email, name, role, academyId FROM users WHERE role='STUDENT' LIMIT 3;
