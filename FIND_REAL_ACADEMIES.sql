-- ============================================================
-- 🔍 실제 학원 데이터 완전 진단
-- ============================================================
-- D1 Console에서 순서대로 실행하세요
-- ============================================================

-- STEP 1: 모든 테이블 목록
-- ============================================================
SELECT '
==============================================
STEP 1: 모든 테이블 목록
==============================================
' as info;
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;


-- STEP 2: User/users 테이블 스키마 확인
-- ============================================================
SELECT '
==============================================
STEP 2: User/users 테이블 스키마
==============================================
' as info;
-- users 테이블
PRAGMA table_info(users);
-- User 테이블 (대문자)
-- PRAGMA table_info(User);


-- STEP 3: Academy/academies 테이블 스키마 확인
-- ============================================================
SELECT '
==============================================
STEP 3: Academy/academies 테이블 스키마
==============================================
' as info;
-- academies 테이블
PRAGMA table_info(academies);
-- Academy 테이블 (대문자)
-- PRAGMA table_info(Academy);


-- STEP 4: 모든 사용자 역할(role) 확인
-- ============================================================
SELECT '
==============================================
STEP 4: 역할별 사용자 수
==============================================
' as info;
SELECT role, COUNT(*) as count FROM users GROUP BY role;


-- STEP 5: 학원장(DIRECTOR) 전체 조회
-- ============================================================
SELECT '
==============================================
STEP 5: 학원장 목록 (모든 컬럼)
==============================================
' as info;
SELECT * FROM users WHERE role = 'DIRECTOR' LIMIT 10;


-- STEP 6: 학원장의 academy_id 확인
-- ============================================================
SELECT '
==============================================
STEP 6: 학원장의 academy_id 분포
==============================================
' as info;
SELECT 
  id,
  name,
  email,
  academy_id,
  CASE 
    WHEN academy_id IS NULL THEN '❌ NULL'
    WHEN academy_id = '' THEN '❌ 빈 문자열'
    ELSE '✅ 있음'
  END as has_academy_id
FROM users 
WHERE role = 'DIRECTOR'
LIMIT 20;


-- STEP 7: Academy 테이블 데이터 확인
-- ============================================================
SELECT '
==============================================
STEP 7: Academy 테이블 데이터
==============================================
' as info;
SELECT * FROM academies LIMIT 10;
-- 에러나면 아래 시도:
-- SELECT * FROM Academy LIMIT 10;


-- STEP 8: 학원장과 학원 JOIN 시도
-- ============================================================
SELECT '
==============================================
STEP 8: 학원장 - Academy JOIN
==============================================
' as info;
SELECT 
  u.id as user_id,
  u.name as director_name,
  u.email,
  u.academy_id as user_academy_id,
  a.id as academy_id,
  a.name as academy_name
FROM users u
LEFT JOIN academies a ON u.academy_id = a.id
WHERE u.role = 'DIRECTOR'
LIMIT 10;


-- STEP 9: 학원별 학생 수 집계
-- ============================================================
SELECT '
==============================================
STEP 9: 학원별 학생 수
==============================================
' as info;
SELECT 
  academy_id,
  COUNT(*) as student_count
FROM users 
WHERE role = 'STUDENT' AND academy_id IS NOT NULL
GROUP BY academy_id
ORDER BY student_count DESC;


-- STEP 10: 학원별 교사 수 집계
-- ============================================================
SELECT '
==============================================
STEP 10: 학원별 교사 수
==============================================
' as info;
SELECT 
  academy_id,
  COUNT(*) as teacher_count
FROM users 
WHERE role = 'TEACHER' AND academy_id IS NOT NULL
GROUP BY academy_id
ORDER BY teacher_count DESC;


-- STEP 11: 학원장-학원-학생-교사 완전 통합 뷰
-- ============================================================
SELECT '
==============================================
STEP 11: 완전 통합 뷰
==============================================
' as info;
SELECT 
  d.id as director_id,
  d.name as director_name,
  d.email as director_email,
  d.academy_id,
  (SELECT COUNT(*) FROM users WHERE academy_id = d.academy_id AND role = 'STUDENT') as students,
  (SELECT COUNT(*) FROM users WHERE academy_id = d.academy_id AND role = 'TEACHER') as teachers
FROM users d
WHERE d.role = 'DIRECTOR'
ORDER BY students DESC
LIMIT 20;


-- ============================================================
-- 📋 이 모든 결과를 복사해서 알려주세요!
-- ============================================================
