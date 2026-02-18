-- =============================================
-- Super Place Complete Database Schema & Test Data
-- =============================================

-- =============================================
-- 1. Drop all existing tables
-- =============================================
DROP TABLE IF EXISTS landing_pages;
DROP TABLE IF EXISTS form_submissions;
DROP TABLE IF EXISTS sms_logs;
DROP TABLE IF EXISTS sms_templates;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS bot_assignments;
DROP TABLE IF EXISTS ai_bots;
DROP TABLE IF EXISTS payment_approvals;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS pricing_plans;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS homework;
DROP TABLE IF EXISTS class_students;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS academy;

-- =============================================
-- 2. Core Tables
-- =============================================

-- Academy (학원)
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

-- Users (사용자)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  academyId TEXT,
  isActive INTEGER DEFAULT 1,
  lastLoginAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_academyId ON users(academyId);
CREATE INDEX idx_users_role ON users(role);

-- Classes (클래스)
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
CREATE INDEX idx_classes_teacherId ON classes(teacherId);

-- Students (학생)
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  grade TEXT,
  parentPhone TEXT,
  parentEmail TEXT,
  status TEXT DEFAULT 'ACTIVE',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academy(id)
);

CREATE INDEX idx_students_userId ON students(userId);
CREATE INDEX idx_students_academyId ON students(academyId);

-- Class Students (클래스-학생 연결)
CREATE TABLE class_students (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  joinedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES classes(id),
  FOREIGN KEY (studentId) REFERENCES students(id)
);

CREATE INDEX idx_class_students_classId ON class_students(classId);
CREATE INDEX idx_class_students_studentId ON class_students(studentId);

-- =============================================
-- 3. Pricing & Subscription Tables
-- =============================================

-- Pricing Plans (요금제)
CREATE TABLE pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  maxStudents INTEGER NOT NULL,
  maxTeachers INTEGER NOT NULL,
  features TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Subscriptions (구독)
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  planId TEXT NOT NULL,
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  autoRenew INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (planId) REFERENCES pricing_plans(id)
);

CREATE INDEX idx_subscriptions_academyId ON subscriptions(academyId);

-- Payment Approvals (결제 승인)
CREATE TABLE payment_approvals (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  planId TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING',
  requestedAt TEXT DEFAULT (datetime('now')),
  approvedAt TEXT,
  approvedBy TEXT,
  rejectedAt TEXT,
  rejectedBy TEXT,
  rejectionReason TEXT,
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (planId) REFERENCES pricing_plans(id)
);

CREATE INDEX idx_payment_approvals_academyId ON payment_approvals(academyId);
CREATE INDEX idx_payment_approvals_status ON payment_approvals(status);

-- =============================================
-- 4. AI Bots Tables
-- =============================================

-- AI Bots (AI 봇)
CREATE TABLE ai_bots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  systemPrompt TEXT NOT NULL,
  model TEXT DEFAULT 'gpt-4',
  temperature REAL DEFAULT 0.7,
  maxTokens INTEGER DEFAULT 1000,
  price INTEGER NOT NULL,
  category TEXT,
  tags TEXT,
  iconUrl TEXT,
  isActive INTEGER DEFAULT 1,
  usageCount INTEGER DEFAULT 0,
  createdBy TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

CREATE INDEX idx_ai_bots_category ON ai_bots(category);
CREATE INDEX idx_ai_bots_isActive ON ai_bots(isActive);

-- Bot Assignments (봇 할당)
CREATE TABLE bot_assignments (
  id TEXT PRIMARY KEY,
  botId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  assignedBy TEXT NOT NULL,
  assignedAt TEXT DEFAULT (datetime('now')),
  expiresAt TEXT,
  isActive INTEGER DEFAULT 1,
  FOREIGN KEY (botId) REFERENCES ai_bots(id),
  FOREIGN KEY (studentId) REFERENCES students(id),
  FOREIGN KEY (assignedBy) REFERENCES users(id)
);

CREATE INDEX idx_bot_assignments_botId ON bot_assignments(botId);
CREATE INDEX idx_bot_assignments_studentId ON bot_assignments(studentId);

-- Chat Messages (채팅 메시지)
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  botId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens INTEGER,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (botId) REFERENCES ai_bots(id),
  FOREIGN KEY (studentId) REFERENCES students(id)
);

CREATE INDEX idx_chat_messages_botId ON chat_messages(botId);
CREATE INDEX idx_chat_messages_studentId ON chat_messages(studentId);
CREATE INDEX idx_chat_messages_createdAt ON chat_messages(createdAt);

-- =============================================
-- 5. SMS Tables
-- =============================================

-- SMS Templates (SMS 템플릿)
CREATE TABLE sms_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  folderId TEXT,
  createdBy TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- SMS Logs (SMS 발송 로그)
CREATE TABLE sms_logs (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'SMS',
  status TEXT DEFAULT 'PENDING',
  cost INTEGER,
  sentAt TEXT,
  sentBy TEXT,
  scheduledAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sentBy) REFERENCES users(id)
);

CREATE INDEX idx_sms_logs_sentBy ON sms_logs(sentBy);
CREATE INDEX idx_sms_logs_sentAt ON sms_logs(sentAt);

-- =============================================
-- 6. Landing Page Tables
-- =============================================

-- Landing Pages (랜딩페이지)
CREATE TABLE landing_pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  templateType TEXT DEFAULT 'basic',
  templateHtml TEXT,
  inputData TEXT,
  ogTitle TEXT,
  ogDescription TEXT,
  thumbnail TEXT,
  folderId TEXT,
  showQrCode INTEGER DEFAULT 1,
  qrCodePosition TEXT DEFAULT 'bottom',
  qrCodeUrl TEXT,
  views INTEGER DEFAULT 0,
  submissions INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdBy TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_landing_pages_createdBy ON landing_pages(createdBy);

-- Form Submissions (폼 제출)
CREATE TABLE form_submissions (
  id TEXT PRIMARY KEY,
  landingPageId TEXT NOT NULL,
  data TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  submittedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (landingPageId) REFERENCES landing_pages(id)
);

CREATE INDEX idx_form_submissions_landingPageId ON form_submissions(landingPageId);
CREATE INDEX idx_form_submissions_submittedAt ON form_submissions(submittedAt);

-- =============================================
-- 7. Attendance & Homework Tables
-- =============================================

-- Attendance (출석)
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  classId TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'PRESENT',
  note TEXT,
  checkedBy TEXT,
  checkedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (studentId) REFERENCES students(id),
  FOREIGN KEY (classId) REFERENCES classes(id),
  FOREIGN KEY (checkedBy) REFERENCES users(id)
);

CREATE INDEX idx_attendance_studentId ON attendance(studentId);
CREATE INDEX idx_attendance_classId ON attendance(classId);
CREATE INDEX idx_attendance_date ON attendance(date);

-- Homework (숙제)
CREATE TABLE homework (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  dueDate TEXT,
  assignedBy TEXT,
  assignedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES classes(id),
  FOREIGN KEY (assignedBy) REFERENCES users(id)
);

CREATE INDEX idx_homework_classId ON homework(classId);
CREATE INDEX idx_homework_dueDate ON homework(dueDate);

-- =============================================
-- 8. Insert Test Data
-- =============================================

-- Test Academy
INSERT INTO academy VALUES (
  'academy-test-001',
  '슈퍼플레이스 테스트 학원',
  'SUPERTEST01',
  '완전한 기능 테스트를 위한 학원',
  '인천광역시 서구 청라커낼로 270, 2층',
  '010-8739-9697',
  'test@superplace.com',
  NULL,
  'PREMIUM',
  100,
  10,
  1,
  datetime('now'),
  datetime('now')
);

-- Admin User
INSERT INTO users VALUES (
  'user-admin-001',
  'admin@superplace.com',
  'admin1234',
  '슈퍼 관리자',
  'SUPER_ADMIN',
  '010-1234-5678',
  NULL,
  1,
  NULL,
  datetime('now'),
  datetime('now')
);

-- Director User
INSERT INTO users VALUES (
  'user-director-001',
  'director@superplace.com',
  'director1234',
  '원장 선생님',
  'DIRECTOR',
  '010-2345-6789',
  'academy-test-001',
  1,
  NULL,
  datetime('now'),
  datetime('now')
);

-- Teacher User
INSERT INTO users VALUES (
  'user-teacher-001',
  'teacher@superplace.com',
  'teacher1234',
  '김강사',
  'TEACHER',
  '010-3456-7890',
  'academy-test-001',
  1,
  NULL,
  datetime('now'),
  datetime('now')
);

-- Student Users (10명)
INSERT INTO users VALUES ('user-student-001', 'student1@test.com', 'student1234', '김학생', 'STUDENT', '010-1111-1111', 'academy-test-001', 1, NULL, datetime('now'), datetime('now'));
INSERT INTO users VALUES ('user-student-002', 'student2@test.com', 'student1234', '이학생', 'STUDENT', '010-2222-2222', 'academy-test-001', 1, NULL, datetime('now'), datetime('now'));
INSERT INTO users VALUES ('user-student-003', 'student3@test.com', 'student1234', '박학생', 'STUDENT', '010-3333-3333', 'academy-test-001', 1, NULL, datetime('now'), datetime('now'));
INSERT INTO users VALUES ('user-student-004', 'student4@test.com', 'student1234', '최학생', 'STUDENT', '010-4444-4444', 'academy-test-001', 1, NULL, datetime('now'), datetime('now'));
INSERT INTO users VALUES ('user-student-005', 'student5@test.com', 'student1234', '정학생', 'STUDENT', '010-5555-5555', 'academy-test-001', 1, NULL, datetime('now'), datetime('now'));
INSERT INTO users VALUES ('user-student-006', 'student6@test.com', 'student1234', '강학생', 'STUDENT', '010-6666-6666', 'academy-test-001', 1, NULL, datetime('now'), datetime('now'));
INSERT INTO users VALUES ('user-student-007', 'student7@test.com', 'student1234', '조학생', 'STUDENT', '010-7777-7777', 'academy-test-001', 1, NULL, datetime('now'), datetime('now'));
INSERT INTO users VALUES ('user-student-008', 'student8@test.com', 'student1234', '윤학생', 'STUDENT', '010-8888-8888', 'academy-test-001', 1, NULL, datetime('now'), datetime('now'));
INSERT INTO users VALUES ('user-student-009', 'student9@test.com', 'student1234', '임학생', 'STUDENT', '010-9999-9999', 'academy-test-001', 1, NULL, datetime('now'), datetime('now'));
INSERT INTO users VALUES ('user-student-010', 'student10@test.com', 'student1234', '한학생', 'STUDENT', '010-0000-0000', 'academy-test-001', 1, NULL, datetime('now'), datetime('now'));

-- Students (학생 정보)
INSERT INTO students VALUES ('student-001', 'user-student-001', 'academy-test-001', '중1', '010-1111-0001', 'parent1@test.com', 'ACTIVE', datetime('now'), datetime('now'));
INSERT INTO students VALUES ('student-002', 'user-student-002', 'academy-test-001', '중2', '010-2222-0002', 'parent2@test.com', 'ACTIVE', datetime('now'), datetime('now'));
INSERT INTO students VALUES ('student-003', 'user-student-003', 'academy-test-001', '중3', '010-3333-0003', 'parent3@test.com', 'ACTIVE', datetime('now'), datetime('now'));
INSERT INTO students VALUES ('student-004', 'user-student-004', 'academy-test-001', '고1', '010-4444-0004', 'parent4@test.com', 'ACTIVE', datetime('now'), datetime('now'));
INSERT INTO students VALUES ('student-005', 'user-student-005', 'academy-test-001', '고2', '010-5555-0005', 'parent5@test.com', 'ACTIVE', datetime('now'), datetime('now'));
INSERT INTO students VALUES ('student-006', 'user-student-006', 'academy-test-001', '고3', '010-6666-0006', 'parent6@test.com', 'ACTIVE', datetime('now'), datetime('now'));
INSERT INTO students VALUES ('student-007', 'user-student-007', 'academy-test-001', '중1', '010-7777-0007', 'parent7@test.com', 'ACTIVE', datetime('now'), datetime('now'));
INSERT INTO students VALUES ('student-008', 'user-student-008', 'academy-test-001', '중2', '010-8888-0008', 'parent8@test.com', 'ACTIVE', datetime('now'), datetime('now'));
INSERT INTO students VALUES ('student-009', 'user-student-009', 'academy-test-001', '중3', '010-9999-0009', 'parent9@test.com', 'ACTIVE', datetime('now'), datetime('now'));
INSERT INTO students VALUES ('student-010', 'user-student-010', 'academy-test-001', '고1', '010-0000-0010', 'parent10@test.com', 'ACTIVE', datetime('now'), datetime('now'));

-- Classes (클래스)
INSERT INTO classes VALUES ('class-001', '중등 수학 A반', '중학교 1-2학년 수학', 'academy-test-001', 'user-teacher-001', '2026-03-01', '2026-12-31', 1, datetime('now'), datetime('now'));
INSERT INTO classes VALUES ('class-002', '중등 수학 B반', '중학교 3학년 수학', 'academy-test-001', 'user-teacher-001', '2026-03-01', '2026-12-31', 1, datetime('now'), datetime('now'));
INSERT INTO classes VALUES ('class-003', '고등 수학 A반', '고등학교 1-2학년 수학', 'academy-test-001', 'user-teacher-001', '2026-03-01', '2026-12-31', 1, datetime('now'), datetime('now'));

-- Class Students (클래스-학생 연결)
INSERT INTO class_students VALUES ('cs-001', 'class-001', 'student-001', datetime('now'));
INSERT INTO class_students VALUES ('cs-002', 'class-001', 'student-002', datetime('now'));
INSERT INTO class_students VALUES ('cs-003', 'class-001', 'student-007', datetime('now'));
INSERT INTO class_students VALUES ('cs-004', 'class-002', 'student-003', datetime('now'));
INSERT INTO class_students VALUES ('cs-005', 'class-002', 'student-009', datetime('now'));
INSERT INTO class_students VALUES ('cs-006', 'class-003', 'student-004', datetime('now'));
INSERT INTO class_students VALUES ('cs-007', 'class-003', 'student-005', datetime('now'));
INSERT INTO class_students VALUES ('cs-008', 'class-003', 'student-006', datetime('now'));

-- Pricing Plans (요금제)
INSERT INTO pricing_plans VALUES ('plan-free', 'FREE', 0, 30, 10, 2, '["기본 기능", "10명 학생", "2명 강사"]', 1, datetime('now'), datetime('now'));
INSERT INTO pricing_plans VALUES ('plan-basic', 'BASIC', 50000, 30, 30, 5, '["모든 기능", "30명 학생", "5명 강사", "AI 챗봇"]', 1, datetime('now'), datetime('now'));
INSERT INTO pricing_plans VALUES ('plan-premium', 'PREMIUM', 100000, 30, 100, 10, '["모든 기능", "100명 학생", "10명 강사", "AI 챗봇", "우선 지원"]', 1, datetime('now'), datetime('now'));

-- AI Bots (AI 봇 - 쇼핑몰 제품)
INSERT INTO ai_bots VALUES ('bot-001', '수학 과외 선생님', '수학 문제를 풀어주고 설명해주는 AI', '당신은 친절한 수학 선생님입니다. 학생의 질문에 쉽게 설명해주세요.', 'gpt-4', 0.7, 1000, 10000, 'MATH', '["수학", "과외", "교육"]', NULL, 1, 0, 'user-admin-001', datetime('now'), datetime('now'));
INSERT INTO ai_bots VALUES ('bot-002', '영어 회화 선생님', '영어 회화를 연습할 수 있는 AI', '당신은 원어민 영어 선생님입니다. 학생과 자연스러운 대화를 나누세요.', 'gpt-4', 0.8, 1000, 15000, 'ENGLISH', '["영어", "회화", "교육"]', NULL, 1, 0, 'user-admin-001', datetime('now'), datetime('now'));
INSERT INTO ai_bots VALUES ('bot-003', '과학 실험 도우미', '과학 실험을 도와주는 AI', '당신은 과학 실험을 도와주는 조교입니다. 안전하고 재미있게 설명하세요.', 'gpt-4', 0.7, 1000, 12000, 'SCIENCE', '["과학", "실험", "교육"]', NULL, 1, 0, 'user-admin-001', datetime('now'), datetime('now'));
INSERT INTO ai_bots VALUES ('bot-004', '역사 스토리텔러', '역사를 재미있게 들려주는 AI', '당신은 역사를 이야기로 들려주는 선생님입니다.', 'gpt-4', 0.9, 1500, 8000, 'HISTORY', '["역사", "스토리", "교육"]', NULL, 1, 0, 'user-admin-001', datetime('now'), datetime('now'));
INSERT INTO ai_bots VALUES ('bot-005', '코딩 튜터', '프로그래밍을 가르쳐주는 AI', '당신은 프로그래밍을 가르치는 선생님입니다.', 'gpt-4', 0.7, 2000, 20000, 'CODING', '["코딩", "프로그래밍", "교육"]', NULL, 1, 0, 'user-admin-001', datetime('now'), datetime('now'));

-- Bot Assignments (봇 할당)
INSERT INTO bot_assignments VALUES ('ba-001', 'bot-001', 'student-001', 'user-director-001', datetime('now'), datetime('now', '+30 days'), 1);
INSERT INTO bot_assignments VALUES ('ba-002', 'bot-001', 'student-002', 'user-director-001', datetime('now'), datetime('now', '+30 days'), 1);
INSERT INTO bot_assignments VALUES ('ba-003', 'bot-002', 'student-003', 'user-director-001', datetime('now'), datetime('now', '+30 days'), 1);
INSERT INTO bot_assignments VALUES ('ba-004', 'bot-003', 'student-004', 'user-director-001', datetime('now'), datetime('now', '+30 days'), 1);

-- SMS Templates (SMS 템플릿)
INSERT INTO sms_templates VALUES ('sms-template-001', '출석 알림', '[슈퍼플레이스] {학생명}님이 {시간}에 출석하였습니다.', NULL, 'user-admin-001', datetime('now'), datetime('now'));
INSERT INTO sms_templates VALUES ('sms-template-002', '숙제 알림', '[슈퍼플레이스] {과목} 숙제 마감일이 {날짜}입니다.', NULL, 'user-admin-001', datetime('now'), datetime('now'));
INSERT INTO sms_templates VALUES ('sms-template-003', '학부모 안내', '[슈퍼플레이스] {학생명} 학부모님께 안내드립니다. {내용}', NULL, 'user-admin-001', datetime('now'), datetime('now'));

-- Payment Approvals (결제 승인 요청)
INSERT INTO payment_approvals VALUES ('payment-001', 'academy-test-001', 'plan-premium', 100000, 'PENDING', datetime('now'), NULL, NULL, NULL, NULL, NULL);

-- =============================================
-- 9. Verification Queries
-- =============================================
SELECT '=== 데이터베이스 테이블 목록 ===' as info;
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

SELECT '=== 사용자 수 ===' as info;
SELECT role, COUNT(*) as count FROM users GROUP BY role;

SELECT '=== 학생 수 ===' as info;
SELECT COUNT(*) as total_students FROM students;

SELECT '=== 클래스 수 ===' as info;
SELECT COUNT(*) as total_classes FROM classes;

SELECT '=== AI 봇 수 ===' as info;
SELECT COUNT(*) as total_bots FROM ai_bots;

SELECT '=== 봇 할당 수 ===' as info;
SELECT COUNT(*) as total_assignments FROM bot_assignments;

SELECT '=== 요금제 수 ===' as info;
SELECT COUNT(*) as total_plans FROM pricing_plans;

SELECT '=== 완료! ===' as info;
