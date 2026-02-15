-- ✅ 학생 ID 184 (Sjss) 업데이트 SQL
-- 
-- 실행 위치: Cloudflare Dashboard → D1 → superplace → Console
-- 
-- ============================================================

-- 1단계: 현재 상태 확인
SELECT 
  id, 
  name, 
  email, 
  phone, 
  school, 
  grade, 
  diagnostic_memo,
  academy_id
FROM users 
WHERE id = 184;

-- 예상 결과:
-- id  | name | school | grade | diagnostic_memo
-- 184 | Sjss | NULL   | NULL  | NULL

-- ============================================================

-- 2단계: 정보 업데이트
UPDATE users 
SET 
  school = '창남고등학교',           -- 👈 실제 학교명으로 변경하세요
  grade = '고3',                     -- 👈 실제 학년으로 변경하세요
  diagnostic_memo = '업데이트 완료', -- 👈 진단 메모 (선택사항)
  academy_id = 120                    -- 👈 소속 학원 ID (120 = 창남)
WHERE id = 184;

-- 예상 결과:
-- Query OK, 1 row affected

-- ============================================================

-- 3단계: 업데이트 결과 확인
SELECT 
  id, 
  name, 
  email, 
  phone, 
  school, 
  grade, 
  diagnostic_memo,
  academy_id
FROM users 
WHERE id = 184;

-- 예상 결과:
-- id  | name | school         | grade | diagnostic_memo | academy_id
-- 184 | Sjss | 창남고등학교    | 고3   | 업데이트 완료    | 120

-- ============================================================

-- 4단계: (컬럼이 없다는 에러가 나오면) 컬럼 추가
-- 
-- 만약 "no such column: school" 에러가 나오면:
-- 
-- ALTER TABLE users ADD COLUMN school TEXT;
-- ALTER TABLE users ADD COLUMN grade TEXT;
-- ALTER TABLE users ADD COLUMN diagnostic_memo TEXT;
-- 
-- 그 다음 2단계 UPDATE를 다시 실행하세요.
--
-- ============================================================

-- ✅ 완료 후:
-- 1. 브라우저에서 Ctrl + F5 (강력 새로고침)
-- 2. 학생 상세 페이지 확인
-- 3. "미등록" → "창남고등학교", "고3" 으로 변경 확인
--
-- ============================================================
