-- ============================================================
-- 학원장 목록 확인 SQL 쿼리
-- ============================================================
-- 목적: 데이터베이스에 실제 학원과 학원장 데이터가 있는지 확인
-- 사용: Cloudflare D1 Console에서 실행
-- ============================================================

-- 1️⃣ 모든 학원 조회
SELECT 
  id,
  name as academy_name,
  address,
  phone,
  email,
  directorId,
  isActive,
  createdAt
FROM Academy
ORDER BY createdAt DESC;

-- 2️⃣ 학원장(DIRECTOR) 사용자 조회
SELECT 
  id,
  name as director_name,
  email,
  phoneNumber,
  role,
  academyId,
  createdAt
FROM User
WHERE role = 'DIRECTOR'
ORDER BY createdAt DESC;

-- 3️⃣ 학원 + 학원장 정보 조인
SELECT 
  a.id as academy_id,
  a.name as academy_name,
  a.address,
  a.phone as academy_phone,
  a.email as academy_email,
  u.id as director_id,
  u.name as director_name,
  u.email as director_email,
  u.phoneNumber as director_phone,
  a.isActive,
  a.createdAt
FROM Academy a
LEFT JOIN User u ON a.directorId = u.id
ORDER BY a.createdAt DESC;

-- 4️⃣ 각 학원별 학생/선생님 수 통계
SELECT 
  a.id,
  a.name as academy_name,
  u.name as director_name,
  (SELECT COUNT(*) FROM User WHERE academyId = a.id AND role = 'STUDENT') as student_count,
  (SELECT COUNT(*) FROM User WHERE academyId = a.id AND role = 'TEACHER') as teacher_count,
  (SELECT COUNT(*) FROM User WHERE academyId = a.id AND role = 'DIRECTOR') as director_count
FROM Academy a
LEFT JOIN User u ON a.directorId = u.id
ORDER BY a.createdAt DESC;

-- 5️⃣ 전체 사용자 역할별 통계
SELECT 
  role,
  COUNT(*) as count
FROM User
GROUP BY role;

-- 6️⃣ academyId가 NULL인 사용자 확인 (학원 미지정)
SELECT 
  id,
  name,
  email,
  role,
  academyId
FROM User
WHERE academyId IS NULL;
