-- ============================================================
-- 🔬 학원 테이블 정밀 분석 및 시각화 SQL
-- ============================================================
-- 목적: 실제 테이블 구조와 데이터를 완전히 파악
-- Cloudflare D1 Console에서 순서대로 실행
-- ============================================================

-- 📊 STEP 1: 모든 테이블 목록 (결과를 복사해주세요)
-- ============================================================
SELECT '=== STEP 1: 전체 테이블 목록 ===' as info;
SELECT 
  name as table_name,
  type as object_type,
  sql as create_statement
FROM sqlite_master 
WHERE type IN ('table', 'view')
ORDER BY name;

-- 📊 STEP 2: Academy/academies 테이블 존재 확인
-- ============================================================
SELECT '=== STEP 2: Academy 테이블 존재 여부 ===' as info;
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='Academy') THEN '✅ Academy 테이블 존재'
    WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='academies') THEN '✅ academies 테이블 존재'
    WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND LOWER(name) LIKE '%academy%') THEN '⚠️ 다른 이름의 academy 테이블 존재'
    ELSE '❌ academy 관련 테이블 없음'
  END as status;

-- 📊 STEP 3: User/users 테이블 존재 확인
-- ============================================================
SELECT '=== STEP 3: User 테이블 존재 여부 ===' as info;
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='User') THEN '✅ User 테이블 존재'
    WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='users') THEN '✅ users 테이블 존재'
    WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND LOWER(name) LIKE '%user%') THEN '⚠️ 다른 이름의 user 테이블 존재'
    ELSE '❌ user 관련 테이블 없음'
  END as status;

-- 📊 STEP 4: Academy 테이블 스키마 (대문자 시도)
-- ============================================================
SELECT '=== STEP 4: Academy 테이블 스키마 ===' as info;
SELECT 
  cid as column_id,
  name as column_name,
  type as data_type,
  "notnull" as not_null,
  dflt_value as default_value,
  pk as primary_key
FROM pragma_table_info('Academy');

-- 📊 STEP 5: academies 테이블 스키마 (소문자 시도)
-- ============================================================
SELECT '=== STEP 5: academies 테이블 스키마 ===' as info;
SELECT 
  cid as column_id,
  name as column_name,
  type as data_type,
  "notnull" as not_null,
  dflt_value as default_value,
  pk as primary_key
FROM pragma_table_info('academies');

-- 📊 STEP 6: User 테이블 스키마 (대문자)
-- ============================================================
SELECT '=== STEP 6: User 테이블 스키마 ===' as info;
SELECT 
  cid as column_id,
  name as column_name,
  type as data_type,
  "notnull" as not_null,
  dflt_value as default_value,
  pk as primary_key
FROM pragma_table_info('User');

-- 📊 STEP 7: users 테이블 스키마 (소문자)
-- ============================================================
SELECT '=== STEP 7: users 테이블 스키마 ===' as info;
SELECT 
  cid as column_id,
  name as column_name,
  type as data_type,
  "notnull" as not_null,
  dflt_value as default_value,
  pk as primary_key
FROM pragma_table_info('users');

-- 📊 STEP 8: Academy 데이터 샘플 (대문자 - 에러나면 SKIP)
-- ============================================================
SELECT '=== STEP 8: Academy 데이터 샘플 (상위 3개) ===' as info;
-- SELECT * FROM Academy LIMIT 3;

-- 📊 STEP 9: academies 데이터 샘플 (소문자 - 에러나면 SKIP)
-- ============================================================
SELECT '=== STEP 9: academies 데이터 샘플 (상위 3개) ===' as info;
-- SELECT * FROM academies LIMIT 3;

-- ============================================================
-- 📋 결과 분석 가이드
-- ============================================================
-- 
-- STEP 1: 모든 테이블 이름이 나옵니다
--         → academy 관련 테이블 이름을 정확히 확인하세요!
-- 
-- STEP 2-3: ✅/❌ 로 존재 여부 확인
-- 
-- STEP 4-7: 테이블 스키마 확인
--         → 결과가 나오면: 해당 테이블이 존재하고 컬럼 정보 확인 가능
--         → 결과가 없으면: 해당 테이블이 없음
-- 
-- STEP 8-9: 실제 데이터 확인 (주석 제거 후 실행)
--         → 에러 나면: 테이블 없음
--         → 결과 나오면: 데이터 존재
-- 
-- ⚠️ 중요: STEP 1의 결과에서 academy 관련 테이블의 정확한 이름을
--          확인한 후, STEP 8-9의 주석을 제거하고 테이블명을 수정하여
--          다시 실행하세요!
-- ============================================================

-- 📊 STEP 10: 데이터 통계 (에러나면 SKIP)
-- ============================================================
-- 아래 쿼리는 STEP 1에서 확인한 정확한 테이블명으로 수정하여 실행하세요
/*
SELECT '=== STEP 10: 데이터 통계 ===' as info;

-- Academy 테이블 통계 (테이블명 수정)
SELECT 
  'Academy' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT id) as unique_ids,
  COUNT(DISTINCT directorId) as unique_directors,
  SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active_count
FROM Academy;

-- User 테이블 통계 (테이블명 수정)
SELECT 
  'User' as table_name,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'DIRECTOR' THEN 1 END) as director_count,
  COUNT(CASE WHEN role = 'STUDENT' THEN 1 END) as student_count,
  COUNT(CASE WHEN role = 'TEACHER' THEN 1 END) as teacher_count
FROM User;
*/

-- 📊 STEP 11: JOIN 테스트 (에러나면 SKIP)
-- ============================================================
-- 아래 쿼리는 STEP 1에서 확인한 정확한 테이블명으로 수정하여 실행하세요
/*
SELECT '=== STEP 11: Academy + User JOIN 테스트 ===' as info;

SELECT 
  a.id as academy_id,
  a.name as academy_name,
  a.directorId as director_id,
  u.name as director_name,
  u.email as director_email,
  u.role as director_role
FROM Academy a
LEFT JOIN User u ON a.directorId = u.id
LIMIT 5;
*/

-- ============================================================
-- 🎯 최종 체크리스트
-- ============================================================
-- 
-- [ ] STEP 1에서 academy 관련 테이블명 확인
-- [ ] STEP 2-3에서 테이블 존재 여부 확인
-- [ ] STEP 4-7에서 스키마 확인 (컬럼명 특히 중요!)
-- [ ] STEP 8-9를 테이블명에 맞게 수정하여 실행
-- [ ] 데이터가 있는지 확인
-- 
-- ✅ 모든 결과를 복사하여 알려주세요!
-- ============================================================
