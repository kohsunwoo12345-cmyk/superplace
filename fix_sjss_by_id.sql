-- 🔍 학생 "Sjss" 정확한 정보 확인 및 강제 업데이트
-- 
-- Cloudflare D1 콘솔에서 실행하세요
-- 
-- ============================================================

-- 1단계: 전화번호로 학생 찾기 (이메일 패턴이 정확하지 않을 수 있음)
SELECT 
  id, 
  name, 
  email, 
  phone, 
  school, 
  grade, 
  diagnostic_memo,
  academy_id,
  role,
  created_at
FROM users 
WHERE phone LIKE '%01085328%'
ORDER BY id DESC;

-- ============================================================

-- 2단계: 이름으로도 찾기
SELECT 
  id, 
  name, 
  email, 
  phone, 
  school, 
  grade, 
  diagnostic_memo,
  academy_id,
  role,
  created_at
FROM users 
WHERE name = 'Sjss'
ORDER BY id DESC;

-- ============================================================

-- 3단계: 모든 최근 학생 확인 (상위 20명)
SELECT 
  id, 
  name, 
  email, 
  phone, 
  school, 
  grade, 
  diagnostic_memo,
  academy_id,
  role,
  created_at
FROM users 
WHERE role = 'STUDENT'
ORDER BY id DESC
LIMIT 20;

-- ============================================================

-- 4단계: 위 결과에서 Sjss의 실제 ID를 확인한 후 아래 실행
-- 👇 여기의 숫자를 실제 ID로 변경하세요!

UPDATE users 
SET 
  school = '서울고등학교',           -- 👈 실제 정보로 변경
  grade = '고2',                     -- 👈 실제 정보로 변경
  diagnostic_memo = '테스트 메모',   -- 👈 실제 정보로 변경
  academy_id = 120
WHERE id = 999;  -- 👈👈👈 여기를 실제 ID로 변경! (예: WHERE id = 164)

-- ============================================================

-- 5단계: 업데이트 확인
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
WHERE id = 999;  -- 👈👈👈 여기도 실제 ID로 변경!

-- ============================================================

-- 6단계: users 테이블에 school, grade, diagnostic_memo 컬럼이 있는지 확인
PRAGMA table_info(users);

-- 예상 결과에 다음 컬럼들이 있어야 함:
-- - school (TEXT)
-- - grade (TEXT)  
-- - diagnostic_memo (TEXT)
--
-- 만약 없다면 다음 실행:

-- ALTER TABLE users ADD COLUMN school TEXT;
-- ALTER TABLE users ADD COLUMN grade TEXT;
-- ALTER TABLE users ADD COLUMN diagnostic_memo TEXT;

-- ============================================================
