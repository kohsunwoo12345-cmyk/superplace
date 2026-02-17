-- kohsunwoo1234@gmail.com 계정 정보 확인
SELECT 
  id,
  email,
  name,
  role,
  academy_id,
  created_at
FROM users
WHERE email = 'kohsunwoo1234@gmail.com';

-- 해당 계정이 속한 학원 정보
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  u.role,
  u.academy_id,
  a.id as academy_table_id,
  a.name as academy_name,
  a.director_id
FROM users u
LEFT JOIN academy a ON u.academy_id = a.id
WHERE u.email = 'kohsunwoo1234@gmail.com';

-- 모든 DIRECTOR 역할의 academy_id 확인
SELECT 
  id,
  email,
  name,
  role,
  academy_id,
  CASE 
    WHEN academy_id IS NULL THEN '❌ NULL'
    WHEN academy_id = 0 THEN '⚠️ ZERO'
    ELSE '✅ ' || CAST(academy_id AS TEXT)
  END as academy_status
FROM users
WHERE UPPER(role) = 'DIRECTOR'
ORDER BY created_at DESC
LIMIT 20;

-- 각 학원별 학생 수 확인
SELECT 
  a.id as academy_id,
  a.name as academy_name,
  COUNT(DISTINCT u.id) as student_count
FROM academy a
LEFT JOIN users u ON u.academy_id = a.id AND UPPER(u.role) = 'STUDENT'
GROUP BY a.id, a.name
ORDER BY academy_id;
