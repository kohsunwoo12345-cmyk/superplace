-- ============================================================
-- 🔍 실제 등록된 학원장과 학원 데이터 확인
-- ============================================================
-- Cloudflare D1 Console에서 실행하세요
-- ============================================================

-- 1️⃣ 모든 테이블 목록
SELECT '=== 1. 모든 테이블 ===' as step;
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- 2️⃣ User 테이블에서 학원장(DIRECTOR) 조회
SELECT '=== 2. 학원장 목록 ===' as step;
SELECT id, name, email, role, academy_id FROM users WHERE role = 'DIRECTOR' LIMIT 10;
-- 에러나면 아래 시도
-- SELECT id, name, email, role, academyId FROM User WHERE role = 'DIRECTOR' LIMIT 10;

-- 3️⃣ Academy 테이블 구조 확인
SELECT '=== 3. Academy 테이블 CREATE 문 ===' as step;
SELECT sql FROM sqlite_master WHERE name LIKE '%cademy%' OR name LIKE '%Academy%';

-- 4️⃣ Academy 데이터 확인
SELECT '=== 4. 학원 데이터 ===' as step;
SELECT * FROM academies LIMIT 10;
-- 에러나면 아래 시도
-- SELECT * FROM Academy LIMIT 10;

-- 5️⃣ 학원장과 학원 연결 확인
SELECT '=== 5. 학원장-학원 매칭 ===' as step;
SELECT 
  u.id as director_id,
  u.name as director_name,
  u.email as director_email,
  u.academy_id,
  a.id as academy_id,
  a.name as academy_name
FROM users u
LEFT JOIN academies a ON u.academy_id = a.id
WHERE u.role = 'DIRECTOR'
LIMIT 10;
-- 에러나면 User/Academy로 시도

-- 6️⃣ 학원별 학생 수
SELECT '=== 6. 학원별 학생 수 ===' as step;
SELECT 
  academy_id,
  COUNT(*) as student_count
FROM users 
WHERE role = 'STUDENT'
GROUP BY academy_id;

-- 7️⃣ 학원별 교사 수
SELECT '=== 7. 학원별 교사 수 ===' as step;
SELECT 
  academy_id,
  COUNT(*) as teacher_count
FROM users 
WHERE role = 'TEACHER'
GROUP BY academy_id;

-- ============================================================
-- 📋 결과를 복사해서 알려주세요!
-- ============================================================
