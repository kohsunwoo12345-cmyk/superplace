-- 학원 정보 확인 및 수정 SQL
-- 
-- Cloudflare D1 콘솔에서 실행
-- 
-- ============================================================

-- 1단계: academy 테이블 확인
SELECT * FROM academy WHERE id = 107;

-- 또는
SELECT * FROM academies WHERE id = 107;

-- ============================================================

-- 2단계: users 테이블에 academy_name 컬럼 추가 (없다면)
-- ALTER TABLE users ADD COLUMN academy_name TEXT;

-- ============================================================

-- 3단계: 학원장의 academy_name을 학생에게 복사
-- 학원장(role='DIRECTOR')의 academy_name을 찾아서 같은 academy_id를 가진 학생들에게 복사

UPDATE users 
SET academy_name = (
  SELECT academy_name 
  FROM users 
  WHERE role = 'DIRECTOR' AND academy_id = users.academy_id
  LIMIT 1
)
WHERE role = 'STUDENT' AND academy_name IS NULL;

-- ============================================================

-- 4단계: 특정 학생(ID 184)의 academy_name 직접 설정
UPDATE users 
SET academy_name = '왕창남'  -- 👈 실제 학원 이름으로 변경
WHERE id = 184;

-- ============================================================

-- 5단계: 확인
SELECT id, name, academy_id, academy_name 
FROM users 
WHERE id = 184;

-- ============================================================
