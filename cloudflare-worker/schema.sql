-- Cloudflare D1 Database Schema
-- Academy Learning Management System

-- User Table
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'STUDENT', -- SUPER_ADMIN, DIRECTOR, TEACHER, STUDENT
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
  approved INTEGER DEFAULT 0,
  approvedAt TEXT,
  approvedBy TEXT,
  lastLoginAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for User
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON User(role);
CREATE INDEX IF NOT EXISTS idx_user_academy ON User(academyId);
CREATE INDEX IF NOT EXISTS idx_user_approved ON User(approved);

-- Academy Table
CREATE TABLE IF NOT EXISTS Academy (
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
  subscriptionPlan TEXT DEFAULT 'FREE',
  maxStudents INTEGER DEFAULT 10,
  maxTeachers INTEGER DEFAULT 2,
  aiUsageLimit INTEGER DEFAULT 100,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for Academy
CREATE INDEX IF NOT EXISTS idx_academy_code ON Academy(code);
CREATE INDEX IF NOT EXISTS idx_academy_plan ON Academy(subscriptionPlan);

-- Bot Assignment Table
CREATE TABLE IF NOT EXISTS BotAssignment (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  botId TEXT NOT NULL,
  grantedById TEXT NOT NULL,
  grantedByRole TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  expiresAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(userId, botId)
);

-- Indexes for BotAssignment
CREATE INDEX IF NOT EXISTS idx_bot_assignment_user ON BotAssignment(userId, isActive);
CREATE INDEX IF NOT EXISTS idx_bot_assignment_granted ON BotAssignment(grantedById);
CREATE INDEX IF NOT EXISTS idx_bot_assignment_bot ON BotAssignment(botId);

-- AI Bot Table
CREATE TABLE IF NOT EXISTS AIBot (
  id TEXT PRIMARY KEY,
  botId TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nameEn TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  bgGradient TEXT NOT NULL,
  systemPrompt TEXT NOT NULL,
  referenceFiles TEXT, -- JSON array of file URLs
  isActive INTEGER DEFAULT 1,
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for AIBot
CREATE INDEX IF NOT EXISTS idx_ai_bot_id ON AIBot(botId);
CREATE INDEX IF NOT EXISTS idx_ai_bot_active ON AIBot(isActive);
CREATE INDEX IF NOT EXISTS idx_ai_bot_creator ON AIBot(createdById);
