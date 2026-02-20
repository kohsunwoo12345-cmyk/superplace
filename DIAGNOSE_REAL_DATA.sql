-- ============================================================
-- 🔍 실제 학원 데이터 완전 진단
-- ============================================================
-- Cloudflare D1 Console에서 순서대로 실행하세요
-- ============================================================

-- STEP 1: 모든 테이블 목록 확인
-- ============================================================
SELECT '
==============================================
STEP 1: 모든 테이블 목록
==============================================
' as info;
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;


-- STEP 2: users 테이블 스키마 확인
-- ============================================================
SELECT '
==============================================
STEP 2: users 테이블 스키마
==============================================
' as info;
PRAGMA table_info(users);


-- STEP 3: 모든 역할(role) 확인
-- ============================================================
SELECT '
==============================================
STEP 3: 역할별 사용자 수
==============================================
' as info;
SELECT 
  role,
  COUNT(*) as count
FROM users 
GROUP BY role
ORDER BY role;


-- STEP 4: 모든 학원장(DIRECTOR) 조회
-- ============================================================
SELECT '
==============================================
STEP 4: 모든 학원장 목록
==============================================
' as info;
SELECT 
  id,
  name,
  email,
  academy_id,
  role,
  created_at
FROM users 
WHERE role = 'DIRECTOR'
ORDER BY created_at DESC;


-- STEP 5: 모든 학생(STUDENT) 조회 및 academy_id 확인
-- ============================================================
SELECT '
==============================================
STEP 5: 모든 학생 목록 (academy_id 포함)
==============================================
' as info;
SELECT 
  id,
  name,
  email,
  academy_id,
  role,
  created_at
FROM users 
WHERE role = 'STUDENT'
ORDER BY academy_id, created_at DESC
LIMIT 50;


-- STEP 6: 모든 교사(TEACHER) 조회
-- ============================================================
SELECT '
==============================================
STEP 6: 모든 교사 목록
==============================================
' as info;
SELECT 
  id,
  name,
  email,
  academy_id,
  role,
  created_at
FROM users 
WHERE role = 'TEACHER'
ORDER BY academy_id, created_at DESC;


-- STEP 7: academy_id별 사용자 분포
-- ============================================================
SELECT '
==============================================
STEP 7: academy_id별 인원 분포
==============================================
' as info;
SELECT 
  COALESCE(academy_id, 'NULL') as academy_id,
  role,
  COUNT(*) as count
FROM users
GROUP BY academy_id, role
ORDER BY academy_id, role;


-- STEP 8: NULL academy_id를 가진 사용자 확인
-- ============================================================
SELECT '
==============================================
STEP 8: academy_id가 NULL인 사용자
==============================================
' as info;
SELECT 
  id,
  name,
  email,
  role,
  academy_id
FROM users
WHERE academy_id IS NULL
ORDER BY role, created_at DESC;


-- STEP 9: academies 테이블 확인 (있으면)
-- ============================================================
SELECT '
==============================================
STEP 9: academies 테이블 데이터
==============================================
' as info;
-- 아래 쿼리가 에러나면 academies 테이블이 없는 것입니다
SELECT * FROM academies LIMIT 10;


-- STEP 10: 학원장과 학생/교사 매칭 확인
-- ============================================================
SELECT '
==============================================
STEP 10: 학원장별 학생/교사 수
==============================================
' as info;
SELECT 
  d.academy_id,
  d.name as director_name,
  d.email as director_email,
  (SELECT COUNT(*) FROM users WHERE academy_id = d.academy_id AND role = 'STUDENT') as student_count,
  (SELECT COUNT(*) FROM users WHERE academy_id = d.academy_id AND role = 'TEACHER') as teacher_count
FROM users d
WHERE d.role = 'DIRECTOR'
ORDER BY d.created_at DESC;


-- ============================================================
-- 📋 이 모든 결과를 복사해서 알려주세요!
-- ============================================================
-- 특히 중요한 정보:
-- 1. STEP 4: 학원장의 academy_id 값
-- 2. STEP 5: 학생들의 academy_id 값
-- 3. STEP 10: 학원장별 학생/교사 수 (0이면 문제!)
-- ============================================================
