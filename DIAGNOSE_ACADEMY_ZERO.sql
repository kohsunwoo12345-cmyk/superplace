-- ============================================================
-- 학원 목록 0개 문제 완전 진단 SQL
-- ============================================================
-- Cloudflare D1 Console에서 순서대로 실행하세요
-- ============================================================

-- 📋 1단계: 모든 테이블 목록 조회
-- ============================================================
SELECT '=== 1단계: 전체 테이블 목록 ===' as step;
SELECT name, type 
FROM sqlite_master 
WHERE type='table' 
ORDER BY name;

-- 📋 2단계: Academy 관련 테이블 찾기
-- ============================================================
SELECT '=== 2단계: Academy 테이블 검색 ===' as step;
SELECT name 
FROM sqlite_master 
WHERE type='table' 
  AND (
    name LIKE '%cademy%' OR 
    name LIKE '%Academy%' OR 
    name LIKE '%ACADEMY%'
  );

-- 📋 3단계: User 관련 테이블 찾기
-- ============================================================
SELECT '=== 3단계: User 테이블 검색 ===' as step;
SELECT name 
FROM sqlite_master 
WHERE type='table' 
  AND (
    name LIKE '%user%' OR 
    name LIKE '%User%' OR 
    name LIKE '%USER%'
  );

-- 📋 4단계: Academy 테이블 스키마 확인 (대문자)
-- ============================================================
SELECT '=== 4단계: Academy 테이블 스키마 (대문자) ===' as step;
PRAGMA table_info(Academy);

-- 📋 5단계: academies 테이블 스키마 확인 (소문자)
-- ============================================================
SELECT '=== 5단계: academies 테이블 스키마 (소문자) ===' as step;
PRAGMA table_info(academies);

-- 📋 6단계: Academy 테이블 데이터 개수 확인 (대문자)
-- ============================================================
SELECT '=== 6단계: Academy 데이터 개수 (대문자) ===' as step;
SELECT COUNT(*) as total_academies FROM Academy;

-- 📋 7단계: academies 테이블 데이터 개수 확인 (소문자)
-- ============================================================
SELECT '=== 7단계: academies 데이터 개수 (소문자) ===' as step;
SELECT COUNT(*) as total_academies FROM academies;

-- 📋 8단계: Academy 테이블 실제 데이터 조회 (대문자)
-- ============================================================
SELECT '=== 8단계: Academy 실제 데이터 (대문자) ===' as step;
SELECT 
  id,
  name,
  address,
  phone,
  email,
  directorId,
  isActive,
  createdAt
FROM Academy
LIMIT 5;

-- 📋 9단계: academies 테이블 실제 데이터 조회 (소문자)
-- ============================================================
SELECT '=== 9단계: academies 실제 데이터 (소문자) ===' as step;
SELECT 
  id,
  name,
  address,
  phone,
  email,
  directorId,
  isActive,
  createdAt
FROM academies
LIMIT 5;

-- 📋 10단계: User 테이블에서 DIRECTOR 조회 (대문자)
-- ============================================================
SELECT '=== 10단계: DIRECTOR 사용자 (User 대문자) ===' as step;
SELECT 
  id,
  name,
  email,
  role,
  academyId
FROM User
WHERE role = 'DIRECTOR'
LIMIT 5;

-- 📋 11단계: users 테이블에서 DIRECTOR 조회 (소문자)
-- ============================================================
SELECT '=== 11단계: DIRECTOR 사용자 (users 소문자) ===' as step;
SELECT 
  id,
  name,
  email,
  role,
  academyId
FROM users
WHERE role = 'DIRECTOR'
LIMIT 5;

-- 📋 12단계: Academy + User 조인 테스트 (대문자)
-- ============================================================
SELECT '=== 12단계: Academy + User 조인 (대문자) ===' as step;
SELECT 
  a.id,
  a.name as academy_name,
  u.name as director_name,
  u.email as director_email
FROM Academy a
LEFT JOIN User u ON a.directorId = u.id
LIMIT 3;

-- 📋 13단계: academies + users 조인 테스트 (소문자)
-- ============================================================
SELECT '=== 13단계: academies + users 조인 (소문자) ===' as step;
SELECT 
  a.id,
  a.name as academy_name,
  u.name as director_name,
  u.email as director_email
FROM academies a
LEFT JOIN users u ON a.directorId = u.id
LIMIT 3;

-- ============================================================
-- 📊 결과 해석 가이드
-- ============================================================
-- 
-- 위 쿼리를 순서대로 실행하면서:
-- 
-- 1. 에러가 나는 쿼리: 해당 테이블이 없음
-- 2. 결과가 0인 쿼리: 테이블은 있지만 데이터 없음
-- 3. 결과가 나오는 쿼리: 정상 작동
-- 
-- 에러가 나지 않고 데이터가 나오는 쿼리 번호를 확인하세요!
-- ============================================================
