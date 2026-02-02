-- 관리자 계정 생성
-- 비밀번호: admin123456 (bcrypt 해시)

INSERT INTO users (
  id, 
  email, 
  password, 
  name, 
  role, 
  phone, 
  academyId, 
  createdAt, 
  updatedAt
) VALUES (
  'admin-' || hex(randomblob(8)),
  'admin@superplace.com',
  '$2a$10$rqZ8vKJXLZ9HhqYqN7yM4.OXqZGqJ0Yh0wJWqKqJZqJZqJZqJZqJZ',
  '슈퍼플레이스 관리자',
  'ADMIN',
  '010-0000-0000',
  NULL,
  datetime('now'),
  datetime('now')
);

-- 테스트용 학원 생성
INSERT INTO academy (
  id,
  name,
  code,
  description,
  address,
  phone,
  email,
  subscriptionPlan,
  maxStudents,
  maxTeachers,
  isActive,
  createdAt,
  updatedAt
) VALUES (
  'academy-' || hex(randomblob(8)),
  '슈퍼플레이스 학원',
  'SUPERPLACE01',
  '체계적인 학습 관리를 위한 스마트 학원',
  '인천광역시 서구 청라커낼로 270, 2층',
  '010-8739-9697',
  'academy@superplace.com',
  'PREMIUM',
  100,
  10,
  1,
  datetime('now'),
  datetime('now')
);
