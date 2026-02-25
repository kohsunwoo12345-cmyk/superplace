-- ============================================================
-- wangholy1@naver.com 사용자 및 클래스 데이터 긴급 확인
-- ============================================================

-- 1️⃣ wangholy1@naver.com 사용자 정보 확인
SELECT 
  id,
  email,
  name,
  role,
  academy_id,
  academyId,
  createdAt
FROM users
WHERE email = 'wangholy1@naver.com';

-- User 테이블도 확인 (대소문자 차이)
SELECT 
  id,
  email,
  name,
  role,
  academy_id,
  academyId,
  createdAt
FROM User
WHERE email = 'wangholy1@naver.com';

-- 2️⃣ 해당 사용자의 학원 ID 확인
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  u.role,
  u.academyId,
  u.academy_id,
  a.id as academy_table_id,
  a.name as academy_name
FROM users u
LEFT JOIN academies a ON (u.academyId = a.id OR u.academy_id = a.id)
WHERE u.email = 'wangholy1@naver.com';

-- 3️⃣ 전체 클래스 목록 확인 (모든 학원)
SELECT 
  c.id,
  c.academy_id,
  c.class_name,
  c.grade,
  c.description,
  c.teacher_id,
  c.created_at,
  a.name as academy_name
FROM classes c
LEFT JOIN academies a ON c.academy_id = a.id
ORDER BY c.created_at DESC
LIMIT 50;

-- 4️⃣ 특정 학원의 클래스 확인 (학원 ID를 찾은 후 실행)
-- 예: wangholy1의 academyId가 1이라면
SELECT 
  id,
  academy_id,
  class_name,
  grade,
  description,
  teacher_id,
  created_at
FROM classes
WHERE academy_id = 1;

-- 5️⃣ 최근 삭제된 클래스 기록 확인 (audit 테이블이 있다면)
SELECT * FROM audit_log 
WHERE table_name = 'classes' 
AND action = 'DELETE' 
ORDER BY created_at DESC 
LIMIT 10;

-- 6️⃣ 모든 학원 목록
SELECT 
  id,
  name,
  directorId,
  isActive,
  createdAt
FROM academies
ORDER BY createdAt DESC;

-- 7️⃣ 클래스 테이블 전체 개수
SELECT COUNT(*) as total_classes FROM classes;

-- 8️⃣ 학원별 클래스 개수
SELECT 
  academy_id,
  COUNT(*) as class_count,
  GROUP_CONCAT(class_name, ', ') as class_names
FROM classes
GROUP BY academy_id;
