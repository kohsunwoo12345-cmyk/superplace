-- =============================================
-- Super Place Complete Database Recovery
-- 모든 테이블 복구 (2026-03-08 최신 버전)
-- =============================================

-- ⚠️ 경고: 이 스크립트는 기존 테이블을 DROP하지 않습니다!
-- 테이블이 없을 경우에만 생성합니다 (CREATE TABLE IF NOT EXISTS)

-- =============================================
-- 1. Core Tables (핵심 테이블)
-- =============================================

-- Academy (학원)
CREATE TABLE IF NOT EXISTS academy (
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

CREATE INDEX IF NOT EXISTS idx_academy_code ON academy(code);

-- Users (사용자)
CREATE TABLE IF NOT EXISTS users (
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_academyId ON users(academyId);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Classes (클래스)
CREATE TABLE IF NOT EXISTS classes (
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

CREATE INDEX IF NOT EXISTS idx_classes_academyId ON classes(academyId);
CREATE INDEX IF NOT EXISTS idx_classes_teacherId ON classes(teacherId);

-- Students (학생)
CREATE TABLE IF NOT EXISTS students (
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

CREATE INDEX IF NOT EXISTS idx_students_userId ON students(userId);
CREATE INDEX IF NOT EXISTS idx_students_academyId ON students(academyId);

-- Class Students (클래스-학생 연결)
CREATE TABLE IF NOT EXISTS class_students (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  joinedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES classes(id),
  FOREIGN KEY (studentId) REFERENCES students(id)
);

CREATE INDEX IF NOT EXISTS idx_class_students_classId ON class_students(classId);
CREATE INDEX IF NOT EXISTS idx_class_students_studentId ON class_students(studentId);

-- =============================================
-- 2. Pricing & Subscription Tables
-- =============================================

-- Pricing Plans (요금제)
CREATE TABLE IF NOT EXISTS pricing_plans (
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
CREATE TABLE IF NOT EXISTS subscriptions (
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

CREATE INDEX IF NOT EXISTS idx_subscriptions_academyId ON subscriptions(academyId);

-- Payment Approvals (결제 승인)
CREATE TABLE IF NOT EXISTS payment_approvals (
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

CREATE INDEX IF NOT EXISTS idx_payment_approvals_academyId ON payment_approvals(academyId);
CREATE INDEX IF NOT EXISTS idx_payment_approvals_status ON payment_approvals(status);

-- =============================================
-- 3. AI Bots Tables
-- =============================================

-- AI Bots (AI 봇)
CREATE TABLE IF NOT EXISTS ai_bots (
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

CREATE INDEX IF NOT EXISTS idx_ai_bots_category ON ai_bots(category);
CREATE INDEX IF NOT EXISTS idx_ai_bots_isActive ON ai_bots(isActive);

-- Bot Assignments (봇 할당)
CREATE TABLE IF NOT EXISTS bot_assignments (
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

CREATE INDEX IF NOT EXISTS idx_bot_assignments_botId ON bot_assignments(botId);
CREATE INDEX IF NOT EXISTS idx_bot_assignments_studentId ON bot_assignments(studentId);

-- Chat Messages (채팅 메시지)
CREATE TABLE IF NOT EXISTS chat_messages (
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

CREATE INDEX IF NOT EXISTS idx_chat_messages_botId ON chat_messages(botId);
CREATE INDEX IF NOT EXISTS idx_chat_messages_studentId ON chat_messages(studentId);
CREATE INDEX IF NOT EXISTS idx_chat_messages_createdAt ON chat_messages(createdAt);

-- AcademyBotSubscription (학원 봇 구독)
CREATE TABLE IF NOT EXISTS AcademyBotSubscription (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  totalStudentSlots INTEGER NOT NULL DEFAULT 0,
  usedStudentSlots INTEGER NOT NULL DEFAULT 0,
  remainingStudentSlots INTEGER NOT NULL DEFAULT 0,
  subscriptionStart TEXT NOT NULL,
  subscriptionEnd TEXT NOT NULL,
  memo TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (productId) REFERENCES ai_bots(id)
);

CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_academy ON AcademyBotSubscription(academyId);
CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_product ON AcademyBotSubscription(productId);
CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_active ON AcademyBotSubscription(isActive);
CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_end ON AcademyBotSubscription(subscriptionEnd);

-- =============================================
-- 4. SMS & Messaging Tables
-- =============================================

-- SMS Templates (SMS 템플릿)
CREATE TABLE IF NOT EXISTS sms_templates (
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
CREATE TABLE IF NOT EXISTS sms_logs (
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

CREATE INDEX IF NOT EXISTS idx_sms_logs_sentBy ON sms_logs(sentBy);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sentAt ON sms_logs(sentAt);

-- MessageSendHistory (메시지 발송 이력)
CREATE TABLE IF NOT EXISTS MessageSendHistory (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  messageType TEXT NOT NULL,
  recipients TEXT NOT NULL,
  content TEXT NOT NULL,
  cost INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PENDING',
  scheduledAt TEXT,
  sentAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_message_send_history_userId ON MessageSendHistory(userId);
CREATE INDEX IF NOT EXISTS idx_message_send_history_status ON MessageSendHistory(status);
CREATE INDEX IF NOT EXISTS idx_message_send_history_sentAt ON MessageSendHistory(sentAt);

-- =============================================
-- 5. Kakao Alimtalk Tables
-- =============================================

-- KakaoChannel (카카오 채널)
CREATE TABLE IF NOT EXISTS KakaoChannel (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  channelName TEXT NOT NULL,
  solapiChannelId TEXT,
  phoneNumber TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_kakao_channel_userId ON KakaoChannel(userId);
CREATE INDEX IF NOT EXISTS idx_kakao_channel_status ON KakaoChannel(status);

-- AlimtalkTemplate (알림톡 템플릿)
CREATE TABLE IF NOT EXISTS AlimtalkTemplate (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  channelId TEXT NOT NULL,
  templateCode TEXT NOT NULL UNIQUE,
  templateName TEXT NOT NULL,
  content TEXT NOT NULL,
  categoryCode TEXT NOT NULL,
  messageType TEXT DEFAULT 'BA',
  emphasizeType TEXT DEFAULT 'NONE',
  buttons TEXT,
  variables TEXT,
  solapiTemplateId TEXT,
  solapiPfId TEXT,
  status TEXT DEFAULT 'PENDING',
  inspectionStatus TEXT,
  rejectionReason TEXT,
  senderKey TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (channelId) REFERENCES KakaoChannel(id)
);

CREATE INDEX IF NOT EXISTS idx_alimtalk_template_userId ON AlimtalkTemplate(userId);
CREATE INDEX IF NOT EXISTS idx_alimtalk_template_channelId ON AlimtalkTemplate(channelId);
CREATE INDEX IF NOT EXISTS idx_alimtalk_template_status ON AlimtalkTemplate(status);
CREATE INDEX IF NOT EXISTS idx_alimtalk_template_code ON AlimtalkTemplate(templateCode);

-- =============================================
-- 6. Landing Page Tables
-- =============================================

-- Landing Pages (랜딩페이지)
CREATE TABLE IF NOT EXISTS landing_pages (
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

CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_createdBy ON landing_pages(createdBy);

-- Form Submissions (폼 제출)
CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  landingPageId TEXT NOT NULL,
  data TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  submittedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (landingPageId) REFERENCES landing_pages(id)
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_landingPageId ON form_submissions(landingPageId);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submittedAt ON form_submissions(submittedAt);

-- =============================================
-- 7. Attendance & Homework Tables
-- =============================================

-- Attendance (출석)
CREATE TABLE IF NOT EXISTS attendance (
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

CREATE INDEX IF NOT EXISTS idx_attendance_studentId ON attendance(studentId);
CREATE INDEX IF NOT EXISTS idx_attendance_classId ON attendance(classId);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- Homework (숙제)
CREATE TABLE IF NOT EXISTS homework (
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

CREATE INDEX IF NOT EXISTS idx_homework_classId ON homework(classId);
CREATE INDEX IF NOT EXISTS idx_homework_dueDate ON homework(dueDate);

-- =============================================
-- 8. Verification Queries
-- =============================================
SELECT '=== 데이터베이스 복구 완료 ===' as info;
SELECT '총 테이블 수:' as info, COUNT(*) as count FROM sqlite_master WHERE type='table';
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
