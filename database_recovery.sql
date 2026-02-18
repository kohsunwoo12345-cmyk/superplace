-- =============================================
-- Super Place Database Recovery Script
-- 모든 데이터베이스 테이블 및 초기 데이터 복구
-- =============================================

-- =============================================
-- 1. Core Tables (Users, Academy, Classes, Students)
-- =============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  academyId TEXT,
  studentCode TEXT,
  className TEXT,
  loginAttempts INTEGER DEFAULT 0,
  lastLoginAttempt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_academyId ON users(academyId);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_studentCode ON users(studentCode);

-- Academy Table
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

-- Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  academyId TEXT NOT NULL,
  teacherId TEXT,
  startDate TEXT,
  endDate TEXT,
  colorTag TEXT DEFAULT '#3B82F6',
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (teacherId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_classes_academyId ON classes(academyId);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
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

CREATE INDEX IF NOT EXISTS idx_students_academyId ON students(academyId);

-- =============================================
-- 2. AI Bot Tables
-- =============================================

CREATE TABLE IF NOT EXISTS ai_bots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  systemPrompt TEXT NOT NULL,
  modelType TEXT DEFAULT 'gemini-pro',
  temperature REAL DEFAULT 0.7,
  maxTokens INTEGER DEFAULT 1000,
  isActive INTEGER DEFAULT 1,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_bots_createdById ON ai_bots(createdById);

CREATE TABLE IF NOT EXISTS bot_assignments (
  id TEXT PRIMARY KEY,
  botId TEXT NOT NULL,
  userId TEXT NOT NULL,
  assignedById TEXT NOT NULL,
  assignedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (botId) REFERENCES ai_bots(id),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (assignedById) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bot_assignments_unique ON bot_assignments(botId, userId);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  botId TEXT,
  title TEXT,
  startedAt TEXT DEFAULT (datetime('now')),
  lastMessageAt TEXT DEFAULT (datetime('now')),
  messageCount INTEGER DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (botId) REFERENCES ai_bots(id)
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_userId ON chat_sessions(userId);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sessionId) REFERENCES chat_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sessionId ON chat_messages(sessionId);

-- =============================================
-- 3. Attendance Tables
-- =============================================

CREATE TABLE IF NOT EXISTS attendance_columns (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  columnDate TEXT NOT NULL,
  columnName TEXT NOT NULL,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES classes(id),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_columns_classId ON attendance_columns(classId);

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  columnId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  status TEXT NOT NULL,
  checkedAt TEXT DEFAULT (datetime('now')),
  checkedById TEXT,
  notes TEXT,
  FOREIGN KEY (columnId) REFERENCES attendance_columns(id),
  FOREIGN KEY (studentId) REFERENCES users(id),
  FOREIGN KEY (checkedById) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_columnId ON attendance_records(columnId);
CREATE INDEX IF NOT EXISTS idx_attendance_records_studentId ON attendance_records(studentId);

-- =============================================
-- 4. Homework Tables
-- =============================================

CREATE TABLE IF NOT EXISTS homework_assignments (
  id TEXT PRIMARY KEY,
  classId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  dueDate TEXT NOT NULL,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (classId) REFERENCES classes(id),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_homework_assignments_classId ON homework_assignments(classId);

CREATE TABLE IF NOT EXISTS homework_submissions (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  imageUrl TEXT,
  submittedAt TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'PENDING',
  feedback TEXT,
  score REAL,
  reviewedAt TEXT,
  reviewedById TEXT,
  FOREIGN KEY (assignmentId) REFERENCES homework_assignments(id),
  FOREIGN KEY (studentId) REFERENCES users(id),
  FOREIGN KEY (reviewedById) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_homework_submissions_assignmentId ON homework_submissions(assignmentId);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_studentId ON homework_submissions(studentId);

-- =============================================
-- 5. SMS Tables
-- =============================================

CREATE TABLE IF NOT EXISTS SMSSender (
  id TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  description TEXT,
  verified INTEGER DEFAULT 0,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sms_sender_phone ON SMSSender(phone_number);

CREATE TABLE IF NOT EXISTS SMSTemplate (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  folder_id TEXT,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sms_template_creator ON SMSTemplate(createdById);

CREATE TABLE IF NOT EXISTS SMSLog (
  id TEXT PRIMARY KEY,
  sender_id TEXT,
  sender_phone TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'SMS',
  status TEXT DEFAULT 'pending',
  cost REAL DEFAULT 0,
  error_message TEXT,
  reserve_time TEXT,
  sent_at TEXT,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sender_id) REFERENCES SMSSender(id),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sms_log_sender ON SMSLog(sender_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_status ON SMSLog(status);

CREATE TABLE IF NOT EXISTS SMSBalance (
  id TEXT PRIMARY KEY,
  balance REAL DEFAULT 0,
  total_charged REAL DEFAULT 0,
  total_used REAL DEFAULT 0,
  lastChargedAt TEXT,
  lastUsedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Parent (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  relationship TEXT,
  address TEXT,
  notes TEXT,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_parent_phone ON Parent(phone);

CREATE TABLE IF NOT EXISTS StudentParent (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  parentId TEXT NOT NULL,
  isPrimary INTEGER DEFAULT 0,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (studentId) REFERENCES users(id),
  FOREIGN KEY (parentId) REFERENCES Parent(id),
  FOREIGN KEY (createdById) REFERENCES users(id),
  UNIQUE(studentId, parentId)
);

CREATE TABLE IF NOT EXISTS RecipientGroup (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS RecipientGroupMember (
  id TEXT PRIMARY KEY,
  groupId TEXT NOT NULL,
  parentId TEXT NOT NULL,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (groupId) REFERENCES RecipientGroup(id),
  FOREIGN KEY (parentId) REFERENCES Parent(id),
  FOREIGN KEY (createdById) REFERENCES users(id),
  UNIQUE(groupId, parentId)
);

-- =============================================
-- 6. Notifications Tables
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  isRead INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  readAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_isRead ON notifications(isRead);

-- =============================================
-- 7. Insert Default Data
-- =============================================

-- Default Admin User (admin@superplace.co.kr / admin123456)
INSERT OR IGNORE INTO users (
  id, email, password, name, role, phone, createdAt, updatedAt
) VALUES (
  'admin-superplace-001',
  'admin@superplace.co.kr',
  '$2a$10$YourBcryptHashHere',
  '슈퍼플레이스 관리자',
  'SUPER_ADMIN',
  '010-8739-9697',
  datetime('now'),
  datetime('now')
);

-- Default Academy
INSERT OR IGNORE INTO academy (
  id, name, code, description, address, phone, email, 
  subscriptionPlan, maxStudents, maxTeachers, isActive, createdAt, updatedAt
) VALUES (
  'academy-superplace-001',
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

-- Default SMS Balance
INSERT OR IGNORE INTO SMSBalance (
  id, balance, total_charged, total_used, createdAt, updatedAt
) VALUES (
  'sms-balance-001',
  0,
  0,
  0,
  datetime('now'),
  datetime('now')
);

-- Default AI Bot (General Assistant)
INSERT OR IGNORE INTO ai_bots (
  id, name, description, systemPrompt, modelType, temperature, maxTokens, isActive, createdById, createdAt, updatedAt
) VALUES (
  'bot-assistant-001',
  '학습 도우미',
  '학생들의 학습을 돕는 AI 어시스턴트',
  '당신은 친절하고 도움이 되는 학습 도우미입니다. 학생들의 질문에 명확하고 이해하기 쉽게 답변해주세요.',
  'gemini-pro',
  0.7,
  1000,
  1,
  'admin-superplace-001',
  datetime('now'),
  datetime('now')
);

-- =============================================
-- 8. Verification
-- =============================================

SELECT '=== Database Recovery Complete ===' AS status;
SELECT 'Total Tables: ' || COUNT(*) AS table_count FROM sqlite_master WHERE type='table';
SELECT 'Admin User: ' || email FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1;
SELECT 'Default Academy: ' || name FROM academy LIMIT 1;
SELECT 'Default Bot: ' || name FROM ai_bots LIMIT 1;
