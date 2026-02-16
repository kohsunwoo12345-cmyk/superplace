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

-- Store Product Table
CREATE TABLE IF NOT EXISTS StoreProduct (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- academy_operation, marketing_blog, expert
  section TEXT NOT NULL, -- academy_bots, blog_bots, expert_bots
  description TEXT NOT NULL,
  shortDescription TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  monthlyPrice INTEGER,
  yearlyPrice INTEGER,
  features TEXT, -- JSON array of features
  detailHtml TEXT, -- HTML content for detail page
  imageUrl TEXT,
  botId TEXT, -- Reference to AIBot
  isActive INTEGER DEFAULT 1,
  isFeatured INTEGER DEFAULT 0,
  displayOrder INTEGER DEFAULT 0,
  keywords TEXT, -- Comma separated keywords for search
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for StoreProduct
CREATE INDEX IF NOT EXISTS idx_store_product_category ON StoreProduct(category);
CREATE INDEX IF NOT EXISTS idx_store_product_active ON StoreProduct(isActive);
CREATE INDEX IF NOT EXISTS idx_store_product_featured ON StoreProduct(isFeatured);
CREATE INDEX IF NOT EXISTS idx_store_product_bot ON StoreProduct(botId);

-- Purchase Request Table
CREATE TABLE IF NOT EXISTS PurchaseRequest (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  directorUserId TEXT NOT NULL,
  directorName TEXT NOT NULL,
  directorEmail TEXT NOT NULL,
  directorPhone TEXT NOT NULL,
  paymentMethod TEXT NOT NULL, -- card, bank_transfer
  subscriptionMonths INTEGER NOT NULL, -- 1, 6, 12
  totalPrice INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
  notes TEXT,
  approvedById TEXT,
  approvedAt TEXT,
  rejectionReason TEXT,
  botAssignmentId TEXT, -- Link to BotAssignment after approval
  expiresAt TEXT, -- Bot expiration date after approval
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for PurchaseRequest
CREATE INDEX IF NOT EXISTS idx_purchase_request_product ON PurchaseRequest(productId);
CREATE INDEX IF NOT EXISTS idx_purchase_request_director ON PurchaseRequest(directorUserId);
CREATE INDEX IF NOT EXISTS idx_purchase_request_status ON PurchaseRequest(status);
CREATE INDEX IF NOT EXISTS idx_purchase_request_approved ON PurchaseRequest(approvedById);

-- Student Classes (Many-to-Many relationship)
-- 학생은 최대 3개의 반에 소속 가능
CREATE TABLE IF NOT EXISTS StudentClasses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  academy_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, class_id)
);

-- Indexes for StudentClasses
CREATE INDEX IF NOT EXISTS idx_student_classes_student ON StudentClasses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_class ON StudentClasses(class_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_academy ON StudentClasses(academy_id);

-- Director Limitations (학원장별 기능 제한 설정)
CREATE TABLE IF NOT EXISTS DirectorLimitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  director_id INTEGER NOT NULL UNIQUE,
  academy_id INTEGER NOT NULL,
  
  -- 숙제 채점 제한
  homework_grading_daily_limit INTEGER DEFAULT 0,  -- 0 = 무제한
  homework_grading_monthly_limit INTEGER DEFAULT 0, -- 0 = 무제한
  homework_grading_daily_used INTEGER DEFAULT 0,
  homework_grading_monthly_used INTEGER DEFAULT 0,
  homework_grading_daily_reset_date TEXT,
  homework_grading_monthly_reset_date TEXT,
  
  -- 학생 수 제한
  max_students INTEGER DEFAULT 0, -- 0 = 무제한
  
  -- 유사문제 출제 기능
  similar_problem_enabled INTEGER DEFAULT 0, -- 0 = OFF, 1 = ON
  similar_problem_daily_limit INTEGER DEFAULT 0, -- 0 = 무제한
  similar_problem_monthly_limit INTEGER DEFAULT 0,
  similar_problem_daily_used INTEGER DEFAULT 0,
  similar_problem_monthly_used INTEGER DEFAULT 0,
  
  -- 부족한 개념 분석 기능
  weak_concept_analysis_enabled INTEGER DEFAULT 1, -- 0 = OFF, 1 = ON (기본 활성화)
  weak_concept_daily_limit INTEGER DEFAULT 0,
  weak_concept_monthly_limit INTEGER DEFAULT 0,
  weak_concept_daily_used INTEGER DEFAULT 0,
  weak_concept_monthly_used INTEGER DEFAULT 0,
  
  -- AI 기반 역량 분석 기능
  competency_analysis_enabled INTEGER DEFAULT 1, -- 0 = OFF, 1 = ON (기본 활성화)
  competency_daily_limit INTEGER DEFAULT 0,
  competency_monthly_limit INTEGER DEFAULT 0,
  competency_daily_used INTEGER DEFAULT 0,
  competency_monthly_used INTEGER DEFAULT 0,
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for DirectorLimitations
CREATE INDEX IF NOT EXISTS idx_director_limitations_director ON DirectorLimitations(director_id);
CREATE INDEX IF NOT EXISTS idx_director_limitations_academy ON DirectorLimitations(academy_id);
