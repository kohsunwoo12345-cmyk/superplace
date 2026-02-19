-- D1 데이터베이스 사용자 복구 및 수정 스크립트
-- 데이터베이스: webapp-production (ID: 8c106540-21b4-4fa9-8879-c4956e459ca1)

-- 1. 기존 사용자 삭제 (있다면)
DELETE FROM User WHERE email IN (
  'admin@superplace.com',
  'director@superplace.com', 
  'teacher@superplace.com',
  'test@test.com'
);

-- 2. 테스트 학원 생성 (없다면)
INSERT OR IGNORE INTO Academy (id, name, code, createdAt, updatedAt)
VALUES (
  'test-academy-001',
  '슈퍼플레이스 테스트 학원',
  'TEST2024',
  datetime('now'),
  datetime('now')
);

-- 3. 관리자 계정 삽입
INSERT INTO User (
  id, email, name, password, role, academyId, approved, createdAt, updatedAt
) VALUES (
  'admin-001',
  'admin@superplace.com',
  '슈퍼플레이스 관리자',
  '00f1b0c3a85a37f11e7e3882da7f1ac680fdc0e49cb23d9086dd92a32f5b977f',
  'SUPER_ADMIN',
  NULL,
  1,
  datetime('now'),
  datetime('now')
);

-- 4. 학원장 계정 삽입
INSERT INTO User (
  id, email, name, password, role, academyId, approved, createdAt, updatedAt
) VALUES (
  'director-001',
  'director@superplace.com',
  '원장',
  '0e837948585f8ec9c22d655fc81af116838db4537a6d9fb705f4a8bad1a8653e',
  'DIRECTOR',
  'test-academy-001',
  1,
  datetime('now'),
  datetime('now')
);

-- 5. 선생님 계정 삽입
INSERT INTO User (
  id, email, name, password, role, academyId, approved, createdAt, updatedAt
) VALUES (
  'teacher-001',
  'teacher@superplace.com',
  '김선생',
  '3b98a7c7192ebae6443663d636522647974b75117bb3e392986e2d52f2b51ff8',
  'TEACHER',
  'test-academy-001',
  1,
  datetime('now'),
  datetime('now')
);

-- 6. 일반 사용자 계정 삽입
INSERT INTO User (
  id, email, name, password, role, academyId, approved, createdAt, updatedAt
) VALUES (
  'user-001',
  'test@test.com',
  '테스트',
  '39ce554e28d01c61d0fac34219a6a071c73a0b925ff3ee7d7cc1ee9a9495f71c',
  'ADMIN',
  NULL,
  1,
  datetime('now'),
  datetime('now')
);

-- 7. 결과 확인
SELECT id, email, name, role, academyId, approved FROM User ORDER BY createdAt DESC;

-- 8. 학원 정보 확인
SELECT id, name, code FROM Academy;
