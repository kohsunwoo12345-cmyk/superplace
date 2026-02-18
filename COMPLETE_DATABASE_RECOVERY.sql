-- ============================================
-- Super Place 완전 데이터베이스 복구 스크립트
-- 모든 테이블 + 테스트 데이터 포함
-- ============================================

-- ============================================
-- 1단계: 기존 테이블 모두 삭제
-- ============================================
DROP TABLE IF EXISTS homework_reports;
DROP TABLE IF EXISTS homework_gradings;
DROP TABLE IF EXISTS homework_submissions;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS student_attendance_codes;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS bot_assignments;
DROP TABLE IF EXISTS ai_bots;
DROP TABLE IF EXISTS class_students;
DROP TABLE IF EXISTS teacher_permissions;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS academy;
DROP TABLE IF EXISTS academies;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS landing_pages;
DROP TABLE IF EXISTS form_submissions;
DROP TABLE IF EXISTS sms_messages;

-- ============================================
-- 2단계: 사용자(Users) 테이블
-- ============================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- SUPER_ADMIN, DIRECTOR, TEACHER, STUDENT, ADMIN
  phone TEXT,
  academyId TEXT,
  grade TEXT,
  class TEXT,
  studentId TEXT UNIQUE,
  parentPhone TEXT,
  points INTEGER DEFAULT 0,
  aiChatEnabled INTEGER DEFAULT 0,
  aiHomeworkEnabled INTEGER DEFAULT 0,
  aiStudyEnabled INTEGER DEFAULT 0,
  emailVerified TEXT,
  image TEXT,
  approved INTEGER DEFAULT 1,
  approvedAt TEXT,
  approvedBy TEXT,
  lastLoginAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_academyId ON users(academyId);
CREATE INDEX idx_users_approved ON users(approved);
CREATE INDEX idx_users_studentId ON users(studentId);

-- ============================================
-- 3단계: 학원(Academy) 테이블
-- ============================================
CREATE TABLE academy (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logoUrl TEXT,
  naverPlaceUrl TEXT,
  naverBlogUrl TEXT,
  directorId TEXT,
  subscriptionPlan TEXT DEFAULT 'FREE',
  maxStudents INTEGER DEFAULT 10,
  maxTeachers INTEGER DEFAULT 2,
  aiUsageLimit INTEGER DEFAULT 100,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (directorId) REFERENCES users(id)
);

CREATE INDEX idx_academy_code ON academy(code);
CREATE INDEX idx_academy_plan ON academy(subscriptionPlan);
CREATE INDEX idx_academy_director ON academy(directorId);

-- ============================================
-- 4단계: 반(Classes) 테이블
-- ============================================
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  academyId TEXT NOT NULL,
  teacherId TEXT,
  grade TEXT,
  subject TEXT,
  startDate TEXT,
  endDate TEXT,
  color TEXT DEFAULT '#3B82F6',
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (teacherId) REFERENCES users(id)
);

CREATE INDEX idx_classes_academyId ON classes(academyId);
CREATE INDEX idx_classes_teacherId ON classes(teacherId);
CREATE INDEX idx_classes_active ON classes(isActive);

-- ============================================
-- 5단계: 학생-반 매핑 테이블
-- ============================================
CREATE TABLE class_students (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  enrolledAt TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'ACTIVE',
  FOREIGN KEY (classId) REFERENCES classes(id),
  FOREIGN KEY (studentId) REFERENCES users(id),
  UNIQUE(classId, studentId)
);

CREATE INDEX idx_class_students_class ON class_students(classId);
CREATE INDEX idx_class_students_student ON class_students(studentId);

-- ============================================
-- 6단계: 선생님 권한 테이블
-- ============================================
CREATE TABLE teacher_permissions (
  id TEXT PRIMARY KEY,
  teacherId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  canViewAllClasses INTEGER DEFAULT 0,
  canViewAllStudents INTEGER DEFAULT 0,
  canManageHomework INTEGER DEFAULT 1,
  canManageAttendance INTEGER DEFAULT 1,
  canViewStatistics INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (teacherId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  UNIQUE(teacherId, academyId)
);

CREATE INDEX idx_teacher_permissions_teacher ON teacher_permissions(teacherId);
CREATE INDEX idx_teacher_permissions_academy ON teacher_permissions(academyId);

-- ============================================
-- 7단계: AI 봇(AI Bots) 테이블
-- ============================================
CREATE TABLE ai_bots (
  id TEXT PRIMARY KEY,
  botId TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nameEn TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  bgGradient TEXT NOT NULL,
  systemPrompt TEXT NOT NULL,
  referenceFiles TEXT, -- JSON array
  price INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  isActive INTEGER DEFAULT 1,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE INDEX idx_ai_bots_botId ON ai_bots(botId);
CREATE INDEX idx_ai_bots_active ON ai_bots(isActive);
CREATE INDEX idx_ai_bots_creator ON ai_bots(createdById);
CREATE INDEX idx_ai_bots_category ON ai_bots(category);

-- ============================================
-- 8단계: AI 봇 할당(Bot Assignments) 테이블
-- ============================================
CREATE TABLE bot_assignments (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  botId TEXT NOT NULL,
  assignedBy TEXT,
  assignedAt TEXT DEFAULT (datetime('now')),
  expiresAt TEXT,
  isActive INTEGER DEFAULT 1,
  notes TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (botId) REFERENCES ai_bots(id),
  FOREIGN KEY (assignedBy) REFERENCES users(id),
  UNIQUE(academyId, botId)
);

CREATE INDEX idx_bot_assignments_academy ON bot_assignments(academyId);
CREATE INDEX idx_bot_assignments_bot ON bot_assignments(botId);
CREATE INDEX idx_bot_assignments_active ON bot_assignments(isActive);
CREATE INDEX idx_bot_assignments_expires ON bot_assignments(expiresAt);

-- ============================================
-- 9단계: 채팅 세션(Chat Sessions) 테이블
-- ============================================
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  botId TEXT NOT NULL,
  title TEXT,
  lastMessage TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (botId) REFERENCES ai_bots(id)
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(userId);
CREATE INDEX idx_chat_sessions_academy ON chat_sessions(academyId);
CREATE INDEX idx_chat_sessions_bot ON chat_sessions(botId);
CREATE INDEX idx_chat_sessions_updated ON chat_sessions(updatedAt);
CREATE INDEX idx_chat_sessions_user_updated ON chat_sessions(userId, updatedAt DESC);

-- ============================================
-- 10단계: 채팅 메시지(Chat Messages) 테이블
-- ============================================
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  imageUrl TEXT,
  audioUrl TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sessionId) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX idx_chat_messages_session ON chat_messages(sessionId);
CREATE INDEX idx_chat_messages_user ON chat_messages(userId);
CREATE INDEX idx_chat_messages_created ON chat_messages(createdAt);

-- ============================================
-- 11단계: 출석 코드(Student Attendance Codes) 테이블
-- ============================================
CREATE TABLE student_attendance_codes (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  academyId TEXT,
  classId TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  expiresAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (classId) REFERENCES classes(id)
);

CREATE INDEX idx_attendance_codes_userId ON student_attendance_codes(userId);
CREATE INDEX idx_attendance_codes_code ON student_attendance_codes(code);
CREATE INDEX idx_attendance_codes_academy ON student_attendance_codes(academyId);

-- ============================================
-- 12단계: 출석 기록(Attendance Records) 테이블
-- ============================================
CREATE TABLE attendance_records (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  attendanceCode TEXT NOT NULL,
  checkInTime TEXT DEFAULT (datetime('now')),
  checkInType TEXT DEFAULT 'CODE',
  academyId TEXT,
  classId TEXT,
  status TEXT DEFAULT 'PRESENT',
  note TEXT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (classId) REFERENCES classes(id)
);

CREATE INDEX idx_attendance_records_userId ON attendance_records(userId);
CREATE INDEX idx_attendance_records_checkInTime ON attendance_records(checkInTime);
CREATE INDEX idx_attendance_records_academy ON attendance_records(academyId);
CREATE INDEX idx_attendance_records_class ON attendance_records(classId);

-- ============================================
-- 13단계: 숙제 제출(Homework Submissions) 테이블
-- ============================================
CREATE TABLE homework_submissions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  attendanceRecordId TEXT,
  imageUrl TEXT NOT NULL,
  imageData TEXT,
  submittedAt TEXT DEFAULT (datetime('now')),
  academyId TEXT,
  classId TEXT,
  teacherId TEXT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (attendanceRecordId) REFERENCES attendance_records(id),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (classId) REFERENCES classes(id),
  FOREIGN KEY (teacherId) REFERENCES users(id)
);

CREATE INDEX idx_homework_submissions_userId ON homework_submissions(userId);
CREATE INDEX idx_homework_submissions_attendanceRecordId ON homework_submissions(attendanceRecordId);
CREATE INDEX idx_homework_submissions_academy ON homework_submissions(academyId);
CREATE INDEX idx_homework_submissions_teacher ON homework_submissions(teacherId);

-- ============================================
-- 14단계: AI 숙제 채점(Homework Gradings) 테이블
-- ============================================
CREATE TABLE homework_gradings (
  id TEXT PRIMARY KEY,
  submissionId TEXT NOT NULL,
  userId TEXT NOT NULL,
  score INTEGER,
  feedback TEXT,
  detectedIssues TEXT,
  strengths TEXT,
  suggestions TEXT,
  gradedAt TEXT DEFAULT (datetime('now')),
  gradedBy TEXT DEFAULT 'GEMINI_AI',
  model TEXT DEFAULT 'gemini-1.5-pro',
  FOREIGN KEY (submissionId) REFERENCES homework_submissions(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX idx_homework_gradings_submissionId ON homework_gradings(submissionId);
CREATE INDEX idx_homework_gradings_userId ON homework_gradings(userId);

-- ============================================
-- 15단계: 숙제 리포트(Homework Reports) 테이블
-- ============================================
CREATE TABLE homework_reports (
  id TEXT PRIMARY KEY,
  submissionId TEXT NOT NULL,
  gradingId TEXT NOT NULL,
  userId TEXT NOT NULL,
  teacherId TEXT,
  directorId TEXT,
  reportType TEXT NOT NULL,
  recipientEmail TEXT,
  sentAt TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'SENT',
  FOREIGN KEY (submissionId) REFERENCES homework_submissions(id),
  FOREIGN KEY (gradingId) REFERENCES homework_gradings(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX idx_homework_reports_submissionId ON homework_reports(submissionId);
CREATE INDEX idx_homework_reports_userId ON homework_reports(userId);

-- ============================================
-- 16단계: 제품(Products) 테이블 - AI 봇 쇼핑몰
-- ============================================
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  botId TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  originalPrice INTEGER,
  category TEXT DEFAULT 'ai-bot',
  imageUrl TEXT,
  features TEXT, -- JSON array
  isActive INTEGER DEFAULT 1,
  soldCount INTEGER DEFAULT 0,
  rating REAL DEFAULT 0.0,
  reviewCount INTEGER DEFAULT 0,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (botId) REFERENCES ai_bots(id),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE INDEX idx_products_botId ON products(botId);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(isActive);
CREATE INDEX idx_products_price ON products(price);

-- ============================================
-- 17단계: 구독(Subscriptions) 테이블
-- ============================================
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  plan TEXT NOT NULL, -- FREE, BASIC, PREMIUM, ENTERPRISE
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CANCELLED
  startDate TEXT DEFAULT (datetime('now')),
  endDate TEXT,
  maxStudents INTEGER DEFAULT 10,
  maxTeachers INTEGER DEFAULT 2,
  aiUsageLimit INTEGER DEFAULT 100,
  price INTEGER DEFAULT 0,
  paymentCycle TEXT DEFAULT 'MONTHLY', -- MONTHLY, YEARLY
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id)
);

CREATE INDEX idx_subscriptions_academy ON subscriptions(academyId);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_endDate ON subscriptions(endDate);

-- ============================================
-- 18단계: 결제(Payments) 테이블
-- ============================================
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  subscriptionId TEXT,
  productId TEXT,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, REFUNDED
  paymentMethod TEXT, -- CARD, BANK_TRANSFER, KAKAO_PAY, NAVER_PAY
  paymentKey TEXT,
  orderId TEXT UNIQUE,
  approvedAt TEXT,
  approvedBy TEXT,
  cancelledAt TEXT,
  cancelReason TEXT,
  receiptUrl TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id),
  FOREIGN KEY (productId) REFERENCES products(id)
);

CREATE INDEX idx_payments_academy ON payments(academyId);
CREATE INDEX idx_payments_subscription ON payments(subscriptionId);
CREATE INDEX idx_payments_product ON payments(productId);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_orderId ON payments(orderId);

-- ============================================
-- 19단계: 랜딩페이지(Landing Pages) 테이블
-- ============================================
CREATE TABLE landing_pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  templateType TEXT DEFAULT 'basic',
  templateHtml TEXT,
  customFields TEXT, -- JSON array
  thumbnailUrl TEXT,
  qrCodeUrl TEXT,
  academyId TEXT,
  folderId TEXT,
  metaTitle TEXT,
  metaDescription TEXT,
  metaKeywords TEXT,
  views INTEGER DEFAULT 0,
  submissions INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_landing_pages_academy ON landing_pages(academyId);
CREATE INDEX idx_landing_pages_folder ON landing_pages(folderId);
CREATE INDEX idx_landing_pages_active ON landing_pages(isActive);

-- ============================================
-- 20단계: 폼 제출(Form Submissions) 테이블
-- ============================================
CREATE TABLE form_submissions (
  id TEXT PRIMARY KEY,
  landingPageId TEXT NOT NULL,
  formData TEXT NOT NULL, -- JSON object
  submitterName TEXT,
  submitterEmail TEXT,
  submitterPhone TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  submittedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (landingPageId) REFERENCES landing_pages(id)
);

CREATE INDEX idx_form_submissions_landingPage ON form_submissions(landingPageId);
CREATE INDEX idx_form_submissions_email ON form_submissions(submitterEmail);
CREATE INDEX idx_form_submissions_submitted ON form_submissions(submittedAt);

-- ============================================
-- 21단계: SMS 메시지(SMS Messages) 테이블
-- ============================================
CREATE TABLE sms_messages (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  senderId TEXT NOT NULL,
  recipientPhone TEXT NOT NULL,
  recipientName TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING', -- PENDING, SENT, FAILED, DELIVERED
  messageType TEXT DEFAULT 'SMS', -- SMS, LMS, MMS
  sendAt TEXT,
  sentAt TEXT,
  deliveredAt TEXT,
  failedReason TEXT,
  cost INTEGER DEFAULT 0,
  messageId TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (senderId) REFERENCES users(id)
);

CREATE INDEX idx_sms_messages_academy ON sms_messages(academyId);
CREATE INDEX idx_sms_messages_sender ON sms_messages(senderId);
CREATE INDEX idx_sms_messages_status ON sms_messages(status);
CREATE INDEX idx_sms_messages_sendAt ON sms_messages(sendAt);

-- ============================================
-- 테스트 데이터 삽입
-- ============================================

-- 관리자 계정들
INSERT INTO users (id, email, password, name, role, phone, academyId, approved, createdAt, updatedAt) VALUES
('admin-001', 'admin@superplace.com', 'admin1234', '슈퍼플레이스 관리자', 'SUPER_ADMIN', '010-8739-9697', NULL, 1, datetime('now'), datetime('now')),
('director-001', 'director@superplace.com', 'director1234', '김원장', 'DIRECTOR', '010-1111-2222', 'academy-001', 1, datetime('now'), datetime('now')),
('teacher-001', 'teacher@superplace.com', 'teacher1234', '박선생', 'TEACHER', '010-3333-4444', 'academy-001', 1, datetime('now'), datetime('now')),
('test-001', 'test@test.com', 'test1234', '테스트 관리자', 'ADMIN', '010-5555-6666', 'academy-001', 1, datetime('now'), datetime('now'));

-- 테스트 학원
INSERT INTO academy (id, name, code, description, address, phone, email, directorId, subscriptionPlan, maxStudents, maxTeachers, aiUsageLimit, isActive, createdAt, updatedAt) VALUES
('academy-001', '슈퍼플레이스 학원', 'SUPERPLACE01', '체계적인 학습 관리를 위한 스마트 학원', '인천광역시 서구 청라커낼로 270, 2층', '010-8739-9697', 'academy@superplace.com', 'director-001', 'PREMIUM', 100, 10, 1000, 1, datetime('now'), datetime('now')),
('academy-002', '테스트 학원', 'TEST001', '테스트용 학원', '서울특별시 강남구 테헤란로 123', '02-1234-5678', 'test@academy.com', 'director-001', 'BASIC', 50, 5, 500, 1, datetime('now'), datetime('now'));

-- 테스트 학생들
INSERT INTO users (id, email, password, name, role, phone, academyId, grade, class, studentId, parentPhone, approved, createdAt, updatedAt) VALUES
('student-001', 'student1@test.com', 'student1234', '김학생', 'STUDENT', '010-1000-0001', 'academy-001', '중1', 'A반', 'ST001', '010-2000-0001', 1, datetime('now'), datetime('now')),
('student-002', 'student2@test.com', 'student1234', '이학생', 'STUDENT', '010-1000-0002', 'academy-001', '중1', 'A반', 'ST002', '010-2000-0002', 1, datetime('now'), datetime('now')),
('student-003', 'student3@test.com', 'student1234', '박학생', 'STUDENT', '010-1000-0003', 'academy-001', '중2', 'B반', 'ST003', '010-2000-0003', 1, datetime('now'), datetime('now')),
('student-004', 'student4@test.com', 'student1234', '최학생', 'STUDENT', '010-1000-0004', 'academy-001', '중2', 'B반', 'ST004', '010-2000-0004', 1, datetime('now'), datetime('now')),
('student-005', 'student5@test.com', 'student1234', '정학생', 'STUDENT', '010-1000-0005', 'academy-001', '중3', 'C반', 'ST005', '010-2000-0005', 1, datetime('now'), datetime('now'));

-- 테스트 반들
INSERT INTO classes (id, name, description, academyId, teacherId, grade, subject, color, isActive, createdAt, updatedAt) VALUES
('class-001', '중1 수학 A반', '중학교 1학년 수학 심화반', 'academy-001', 'teacher-001', '중1', '수학', '#3B82F6', 1, datetime('now'), datetime('now')),
('class-002', '중2 수학 B반', '중학교 2학년 수학 기본반', 'academy-001', 'teacher-001', '중2', '수학', '#10B981', 1, datetime('now'), datetime('now')),
('class-003', '중3 수학 C반', '중학교 3학년 수학 특별반', 'academy-001', 'teacher-001', '중3', '수학', '#F59E0B', 1, datetime('now'), datetime('now'));

-- 학생-반 매핑
INSERT INTO class_students (id, classId, studentId, enrolledAt, status) VALUES
('cs-001', 'class-001', 'student-001', datetime('now'), 'ACTIVE'),
('cs-002', 'class-001', 'student-002', datetime('now'), 'ACTIVE'),
('cs-003', 'class-002', 'student-003', datetime('now'), 'ACTIVE'),
('cs-004', 'class-002', 'student-004', datetime('now'), 'ACTIVE'),
('cs-005', 'class-003', 'student-005', datetime('now'), 'ACTIVE');

-- AI 봇들
INSERT INTO ai_bots (id, botId, name, nameEn, description, icon, color, bgGradient, systemPrompt, price, category, isActive, createdById, createdAt, updatedAt) VALUES
('bot-001', 'math-tutor-01', '수학 선생님', 'Math Tutor', '중고등 수학 문제를 단계별로 설명해주는 AI 튜터', '🧮', '#3B82F6', 'from-blue-500 to-cyan-500', '당신은 친절하고 인내심 있는 수학 선생님입니다. 학생이 이해할 때까지 단계별로 설명해주세요.', 9900, 'education', 1, 'admin-001', datetime('now'), datetime('now')),
('bot-002', 'english-tutor-01', '영어 선생님', 'English Tutor', '영어 문법과 회화를 도와주는 AI 튜터', '📚', '#10B981', 'from-green-500 to-emerald-500', '당신은 영어 전문 튜터입니다. 문법 설명과 예문을 제공하며 학생의 영어 실력 향상을 도와주세요.', 9900, 'education', 1, 'admin-001', datetime('now'), datetime('now')),
('bot-003', 'homework-helper-01', '숙제 도우미', 'Homework Helper', '숙제 검사와 피드백을 제공하는 AI', '✏️', '#F59E0B', 'from-yellow-500 to-orange-500', '당신은 숙제 검사 전문 AI입니다. 학생의 답안을 꼼꼼히 확인하고 건설적인 피드백을 제공하세요.', 14900, 'education', 1, 'admin-001', datetime('now'), datetime('now'));

-- AI 봇 할당
INSERT INTO bot_assignments (id, academyId, botId, assignedBy, assignedAt, expiresAt, isActive, notes, createdAt, updatedAt) VALUES
('ba-001', 'academy-001', 'bot-001', 'admin-001', datetime('now'), datetime('now', '+30 days'), 1, '체험용 30일 무료 제공', datetime('now'), datetime('now')),
('ba-002', 'academy-001', 'bot-002', 'admin-001', datetime('now'), datetime('now', '+30 days'), 1, '체험용 30일 무료 제공', datetime('now'), datetime('now')),
('ba-003', 'academy-001', 'bot-003', 'admin-001', datetime('now'), NULL, 1, '프리미엄 플랜 혜택', datetime('now'), datetime('now'));

-- 쇼핑몰 제품
INSERT INTO products (id, botId, name, description, price, originalPrice, category, features, isActive, soldCount, rating, reviewCount, createdById, createdAt, updatedAt) VALUES
('prod-001', 'bot-001', '수학 선생님 AI', '중고등 수학 전문 AI 튜터', 9900, 14900, 'ai-bot', '["단계별 풀이", "무제한 질문", "24시간 이용"]', 1, 152, 4.8, 47, 'admin-001', datetime('now'), datetime('now')),
('prod-002', 'bot-002', '영어 선생님 AI', '영어 문법 & 회화 전문 AI', 9900, 14900, 'ai-bot', '["문법 설명", "회화 연습", "발음 교정"]', 1, 128, 4.7, 38, 'admin-001', datetime('now'), datetime('now')),
('prod-003', 'bot-003', '숙제 도우미 AI', '숙제 검사 & 피드백 AI', 14900, 19900, 'ai-bot', '["자동 채점", "상세 피드백", "학습 리포트"]', 1, 95, 4.9, 52, 'admin-001', datetime('now'), datetime('now'));

-- 구독
INSERT INTO subscriptions (id, academyId, plan, status, startDate, endDate, maxStudents, maxTeachers, aiUsageLimit, price, paymentCycle, createdAt, updatedAt) VALUES
('sub-001', 'academy-001', 'PREMIUM', 'ACTIVE', datetime('now'), datetime('now', '+365 days'), 100, 10, 1000, 990000, 'YEARLY', datetime('now'), datetime('now')),
('sub-002', 'academy-002', 'BASIC', 'ACTIVE', datetime('now'), datetime('now', '+30 days'), 50, 5, 500, 99000, 'MONTHLY', datetime('now'), datetime('now'));

-- 결제 기록
INSERT INTO payments (id, academyId, subscriptionId, amount, status, paymentMethod, orderId, approvedAt, approvedBy, createdAt, updatedAt) VALUES
('pay-001', 'academy-001', 'sub-001', 990000, 'APPROVED', 'CARD', 'ORDER-2024-001', datetime('now'), 'admin-001', datetime('now'), datetime('now')),
('pay-002', 'academy-002', 'sub-002', 99000, 'APPROVED', 'BANK_TRANSFER', 'ORDER-2024-002', datetime('now'), 'admin-001', datetime('now'), datetime('now'));

-- 출석 코드
INSERT INTO student_attendance_codes (id, userId, code, academyId, classId, isActive, createdAt) VALUES
('ac-001', 'student-001', 'ATD001', 'academy-001', 'class-001', 1, datetime('now')),
('ac-002', 'student-002', 'ATD002', 'academy-001', 'class-001', 1, datetime('now')),
('ac-003', 'student-003', 'ATD003', 'academy-001', 'class-002', 1, datetime('now')),
('ac-004', 'student-004', 'ATD004', 'academy-001', 'class-002', 1, datetime('now')),
('ac-005', 'student-005', 'ATD005', 'academy-001', 'class-003', 1, datetime('now'));

-- ============================================
-- 데이터베이스 복구 완료
-- ============================================

-- 확인 쿼리들
SELECT '=== Users ===' as section;
SELECT COUNT(*) as total_users FROM users;
SELECT role, COUNT(*) as count FROM users GROUP BY role;

SELECT '=== Academies ===' as section;
SELECT COUNT(*) as total_academies FROM academy;
SELECT name, subscriptionPlan, maxStudents FROM academy;

SELECT '=== Classes ===' as section;
SELECT COUNT(*) as total_classes FROM classes;
SELECT name, grade, subject FROM classes;

SELECT '=== Students ===' as section;
SELECT COUNT(*) as total_students FROM users WHERE role = 'STUDENT';
SELECT name, grade, class, studentId FROM users WHERE role = 'STUDENT';

SELECT '=== AI Bots ===' as section;
SELECT COUNT(*) as total_bots FROM ai_bots;
SELECT name, nameEn, category, price FROM ai_bots;

SELECT '=== Bot Assignments ===' as section;
SELECT COUNT(*) as total_assignments FROM bot_assignments;
SELECT a.name as academy, b.name as bot, ba.isActive, ba.expiresAt 
FROM bot_assignments ba
JOIN academy a ON ba.academyId = a.id
JOIN ai_bots b ON ba.botId = b.id;

SELECT '=== Products ===' as section;
SELECT COUNT(*) as total_products FROM products;
SELECT name, price, soldCount, rating FROM products;

SELECT '=== Subscriptions ===' as section;
SELECT COUNT(*) as total_subscriptions FROM subscriptions;
SELECT a.name as academy, s.plan, s.status, s.endDate 
FROM subscriptions s
JOIN academy a ON s.academyId = a.id;

SELECT '=== Payments ===' as section;
SELECT COUNT(*) as total_payments FROM payments;
SELECT p.orderId, a.name as academy, p.amount, p.status, p.approvedAt
FROM payments p
JOIN academy a ON p.academyId = a.id;

SELECT '=== Database Recovery Complete ===' as section;
