-- ============================================
-- D1 데이터베이스 전체 사용자 확인 SQL
-- ============================================

-- 1. 모든 사용자 목록 (역할별로 정렬)
SELECT 
  id,
  email,
  name,
  role,
  phone,
  academyId,
  approved,
  SUBSTR(password, 1, 20) || '...' as password_preview,
  LENGTH(password) as password_length,
  createdAt,
  lastLoginAt
FROM User 
ORDER BY 
  CASE role
    WHEN 'SUPER_ADMIN' THEN 1
    WHEN 'ADMIN' THEN 2
    WHEN 'DIRECTOR' THEN 3
    WHEN 'TEACHER' THEN 4
    WHEN 'STUDENT' THEN 5
    ELSE 6
  END,
  createdAt DESC;

-- 2. 역할별 사용자 수
SELECT 
  role,
  COUNT(*) as count
FROM User 
GROUP BY role
ORDER BY count DESC;

-- 3. 학원별 사용자 수
SELECT 
  a.name as academy_name,
  a.code as academy_code,
  COUNT(u.id) as user_count
FROM Academy a
LEFT JOIN User u ON a.id = u.academyId
GROUP BY a.id, a.name, a.code
ORDER BY user_count DESC;

-- 4. 최근 로그인한 사용자 (Top 10)
SELECT 
  email,
  name,
  role,
  lastLoginAt
FROM User 
WHERE lastLoginAt IS NOT NULL
ORDER BY lastLoginAt DESC
LIMIT 10;

-- 5. 승인되지 않은 사용자
SELECT 
  email,
  name,
  role,
  academyId,
  createdAt
FROM User 
WHERE approved = 0
ORDER BY createdAt DESC;

-- 6. 특정 이메일로 사용자 찾기 (테스트 계정)
SELECT 
  id,
  email,
  name,
  password,
  role,
  phone,
  academyId,
  approved
FROM User 
WHERE email IN (
  'admin@superplace.com',
  'admin@superplace.co.kr',
  'test@test.com',
  'test3@test.com',
  'director@superplace.com',
  'teacher@superplace.com'
);

-- 7. 전체 통계
SELECT 
  (SELECT COUNT(*) FROM User) as total_users,
  (SELECT COUNT(*) FROM Academy) as total_academies,
  (SELECT COUNT(*) FROM User WHERE approved = 1) as approved_users,
  (SELECT COUNT(*) FROM User WHERE approved = 0) as pending_users;
