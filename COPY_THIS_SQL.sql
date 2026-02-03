-- ============================================
-- 🚨 긴급: 이 SQL을 복사해서 D1 Console에 붙여넣으세요!
-- ============================================

-- 1단계: 기존 테이블 삭제 (있다면)
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS academy;

-- 2단계: Users 테이블 생성 (academyId 포함!)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  academyId TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_academyId ON users(academyId);

-- 3단계: Academy 테이블 생성
CREATE TABLE academy (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logoUrl TEXT,
  subscriptionPlan TEXT DEFAULT 'FREE',
  maxStudents INTEGER DEFAULT 10,
  maxTeachers INTEGER DEFAULT 2,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_academy_code ON academy(code);

-- 4단계: Classes 테이블 생성
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  academyId TEXT NOT NULL,
  teacherId TEXT,
  startDate TEXT,
  endDate TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (teacherId) REFERENCES users(id)
);

CREATE INDEX idx_classes_academyId ON classes(academyId);

-- 5단계: Students 테이블 생성
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  grade TEXT,
  parentPhone TEXT,
  status TEXT DEFAULT 'ACTIVE',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academy(id)
);

CREATE INDEX idx_students_academyId ON students(academyId);

-- 6단계: 관리자 계정 생성
INSERT INTO users (id, email, password, name, role, phone, academyId, createdAt, updatedAt)
VALUES ('admin-001', 'admin@superplace.com', 'admin123456', '슈퍼플레이스 관리자', 'ADMIN', '010-8739-9697', NULL, datetime('now'), datetime('now'));

-- 7단계: 테스트 학원 생성
INSERT INTO academy (id, name, code, description, address, phone, email, subscriptionPlan, maxStudents, maxTeachers, isActive, createdAt, updatedAt)
VALUES ('academy-001', '슈퍼플레이스 학원', 'SUPERPLACE01', '체계적인 학습 관리를 위한 스마트 학원', '인천광역시 서구 청라커낼로 270, 2층', '010-8739-9697', 'academy@superplace.com', 'PREMIUM', 100, 10, 1, datetime('now'), datetime('now'));

-- 8단계: 확인
SELECT * FROM users WHERE email = 'admin@superplace.com';

-- ============================================
-- 예상 결과:
-- admin-001 | admin@superplace.com | admin123456 | 슈퍼플레이스 관리자 | ADMIN | 010-8739-9697 | (null) | ...
-- ============================================
