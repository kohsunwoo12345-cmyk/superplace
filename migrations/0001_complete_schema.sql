-- =============================================
-- Super Place D1 Database - Complete Schema
-- =============================================

-- 1. Drop existing tables (if any)
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS academy;

-- =============================================
-- 2. Users Table
-- =============================================
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

-- =============================================
-- 3. Academy Table
-- =============================================
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

-- =============================================
-- 4. Classes Table
-- =============================================
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

-- =============================================
-- 5. Students Table
-- =============================================
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

-- =============================================
-- 6. Insert Admin User
-- =============================================
INSERT INTO users (
  id, email, password, name, role, phone, academyId, createdAt, updatedAt
) VALUES (
  'admin-001',
  'admin@superplace.com',
  'admin123456',
  '슈퍼플레이스 관리자',
  'ADMIN',
  '010-8739-9697',
  NULL,
  datetime('now'),
  datetime('now')
);

-- =============================================
-- 7. Insert Test Academy
-- =============================================
INSERT INTO academy (
  id, name, code, description, address, phone, email, 
  subscriptionPlan, maxStudents, maxTeachers, isActive, 
  createdAt, updatedAt
) VALUES (
  'academy-001',
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

-- =============================================
-- 8. Verification Queries
-- =============================================
-- Check users table structure
-- PRAGMA table_info(users);

-- Check admin account
-- SELECT * FROM users WHERE email = 'admin@superplace.com';

-- Check academy
-- SELECT * FROM academy WHERE code = 'SUPERPLACE01';

-- Check all tables
-- SELECT name FROM sqlite_master WHERE type='table';
