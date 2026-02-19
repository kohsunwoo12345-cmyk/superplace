-- ============================================
-- 학생 계정 정보 조회 SQL
-- ============================================
-- Cloudflare D1 Console에서 실행
-- ============================================

-- 1️⃣ 특정 학생 계정 조회
SELECT 
  id,
  email,
  name,
  role,
  password,
  phoneNumber,
  academyId,
  createdAt,
  updatedAt
FROM User 
WHERE email = 'student_01012341234@phone.generated';

-- 2️⃣ 전화번호로 검색
SELECT 
  id,
  email,
  name,
  role,
  password,
  phoneNumber
FROM User 
WHERE phoneNumber LIKE '%01012341234%';

-- 3️⃣ 학생 역할 모든 계정 조회
SELECT 
  id,
  email,
  name,
  password,
  phoneNumber,
  academyId
FROM User 
WHERE role = 'STUDENT'
ORDER BY createdAt DESC
LIMIT 10;

-- 4️⃣ phone.generated 도메인 모든 계정
SELECT 
  id,
  email,
  name,
  password,
  phoneNumber
FROM User 
WHERE email LIKE '%@phone.generated'
ORDER BY createdAt DESC;

-- ============================================
-- 💡 비밀번호 재설정 (필요 시)
-- ============================================

-- 새 비밀번호로 변경 (예: 'newpassword123')
-- 주의: 실제로는 해시된 비밀번호를 사용해야 함
UPDATE User 
SET password = 'newpassword123',
    updatedAt = datetime('now')
WHERE email = 'student_01012341234@phone.generated';

-- 변경 확인
SELECT email, password, updatedAt 
FROM User 
WHERE email = 'student_01012341234@phone.generated';
