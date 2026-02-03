-- ================================================
-- 🎯 테스트 계정 생성 SQL
-- ================================================
-- D1 Console에서 실행하세요!
-- ================================================

-- 1. 테스트 관리자 계정
INSERT INTO users (id, email, password, name, role, phone, academyId, createdAt, updatedAt)
VALUES (
  'user-test-admin-001',
  'admin@superplace.com',
  'admin123456',
  '슈퍼플레이스 관리자',
  'DIRECTOR',
  '010-1234-5678',
  NULL,
  datetime('now'),
  datetime('now')
);

-- 2. 테스트 선생님 계정
INSERT INTO users (id, email, password, name, role, phone, academyId, createdAt, updatedAt)
VALUES (
  'user-test-teacher-001',
  'teacher@superplace.com',
  'teacher123',
  '김선생',
  'TEACHER',
  '010-2345-6789',
  NULL,
  datetime('now'),
  datetime('now')
);

-- 3. 테스트 학생 계정
INSERT INTO users (id, email, password, name, role, phone, academyId, createdAt, updatedAt)
VALUES (
  'user-test-student-001',
  'student@superplace.com',
  'student123',
  '홍길동',
  'STUDENT',
  '010-3456-7890',
  NULL,
  datetime('now'),
  datetime('now')
);

-- 4. 확인
SELECT id, email, name, role FROM users WHERE email LIKE '%superplace.com';
