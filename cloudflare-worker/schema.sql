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
  school TEXT,
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
CREATE INDEX IF NOT EXISTS idx_user_school ON User(school);

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

-- Landing Page Template Table
CREATE TABLE IF NOT EXISTS LandingPageTemplate (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  html TEXT NOT NULL, -- HTML template with variables like {{studentName}}, {{period}}, etc.
  variables TEXT, -- JSON array of variable names used in the template
  isDefault INTEGER DEFAULT 0, -- 1 if this is the default template
  usageCount INTEGER DEFAULT 0, -- Number of times this template has been used
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

-- Indexes for LandingPageTemplate
CREATE INDEX IF NOT EXISTS idx_landing_template_creator ON LandingPageTemplate(createdById);
CREATE INDEX IF NOT EXISTS idx_landing_template_default ON LandingPageTemplate(isDefault);

-- Landing Page Folder Table
CREATE TABLE IF NOT EXISTS LandingPageFolder (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

-- Indexes for LandingPageFolder
CREATE INDEX IF NOT EXISTS idx_landing_folder_creator ON LandingPageFolder(createdById);

-- Landing Page Table
CREATE TABLE IF NOT EXISTS LandingPage (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  templateType TEXT NOT NULL DEFAULT 'basic', -- basic, student_report, event, custom
  templateId TEXT, -- Reference to LandingPageTemplate
  templateHtml TEXT, -- Custom HTML template (if templateType is 'custom')
  startDate TEXT, -- Start date for student data period
  endDate TEXT, -- End date for student data period
  inputData TEXT, -- JSON array of custom fields
  ogTitle TEXT, -- Open Graph title
  ogDescription TEXT, -- Open Graph description
  thumbnail TEXT, -- Base64 or URL
  folderId TEXT,
  showQrCode INTEGER DEFAULT 1,
  qrCodePosition TEXT DEFAULT 'bottom', -- top, bottom, sidebar
  qrCodeUrl TEXT,
  pixelScripts TEXT, -- JSON array of tracking pixel scripts
  studentId TEXT, -- If linked to student report
  viewCount INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdById TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (folderId) REFERENCES LandingPageFolder(id),
  FOREIGN KEY (templateId) REFERENCES LandingPageTemplate(id),
  FOREIGN KEY (studentId) REFERENCES User(id),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

-- Indexes for LandingPage
CREATE INDEX IF NOT EXISTS idx_landing_slug ON LandingPage(slug);
CREATE INDEX IF NOT EXISTS idx_landing_folder ON LandingPage(folderId);
CREATE INDEX IF NOT EXISTS idx_landing_template ON LandingPage(templateId);
CREATE INDEX IF NOT EXISTS idx_landing_student ON LandingPage(studentId);
CREATE INDEX IF NOT EXISTS idx_landing_creator ON LandingPage(createdById);
CREATE INDEX IF NOT EXISTS idx_landing_active ON LandingPage(isActive);

-- Landing Page Submission Table
CREATE TABLE IF NOT EXISTS LandingPageSubmission (
  id TEXT PRIMARY KEY,
  landingPageId TEXT NOT NULL,
  slug TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON data submitted by user
  ipAddress TEXT,
  userAgent TEXT,
  submittedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (landingPageId) REFERENCES LandingPage(id) ON DELETE CASCADE
);

-- Indexes for LandingPageSubmission
CREATE INDEX IF NOT EXISTS idx_submission_landing ON LandingPageSubmission(landingPageId);
CREATE INDEX IF NOT EXISTS idx_submission_slug ON LandingPageSubmission(slug);
CREATE INDEX IF NOT EXISTS idx_submission_date ON LandingPageSubmission(submittedAt);

-- Landing Page Pixel Script Table
CREATE TABLE IF NOT EXISTS LandingPagePixelScript (
  id TEXT PRIMARY KEY,
  landingPageId TEXT NOT NULL,
  name TEXT NOT NULL, -- e.g., "당근 비즈니스 픽셀", "Facebook Pixel"
  scriptType TEXT NOT NULL, -- header, body, footer
  scriptCode TEXT NOT NULL, -- The actual script code
  isActive INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (landingPageId) REFERENCES LandingPage(id) ON DELETE CASCADE
);

-- Indexes for LandingPagePixelScript
CREATE INDEX IF NOT EXISTS idx_pixel_landing ON LandingPagePixelScript(landingPageId);
CREATE INDEX IF NOT EXISTS idx_pixel_active ON LandingPagePixelScript(isActive);

-- Kakao Channel Table
CREATE TABLE IF NOT EXISTS KakaoChannel (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userName TEXT,
  phoneNumber TEXT NOT NULL,
  channelName TEXT NOT NULL,
  searchId TEXT NOT NULL,
  categoryCode TEXT NOT NULL,
  mainCategory TEXT,
  middleCategory TEXT,
  subCategory TEXT,
  businessNumber TEXT,
  solapiChannelId TEXT,
  status TEXT DEFAULT 'PENDING',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Indexes for KakaoChannel
CREATE INDEX IF NOT EXISTS idx_kakao_channel_user ON KakaoChannel(userId);
CREATE INDEX IF NOT EXISTS idx_kakao_channel_search ON KakaoChannel(searchId);
CREATE INDEX IF NOT EXISTS idx_kakao_channel_status ON KakaoChannel(status);

-- Alimtalk Template Table
CREATE TABLE IF NOT EXISTS AlimtalkTemplate (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  channelId TEXT NOT NULL,
  solapiChannelId TEXT,
  solapiTemplateId TEXT,
  templateCode TEXT,
  templateName TEXT NOT NULL,
  content TEXT NOT NULL,
  categoryCode TEXT,
  messageType TEXT DEFAULT 'BA',
  emphasizeType TEXT DEFAULT 'NONE',
  buttons TEXT, -- JSON string
  quickReplies TEXT, -- JSON string
  variables TEXT, -- JSON string array
  status TEXT DEFAULT 'PENDING',
  inspectionStatus TEXT,
  approvedAt TEXT,
  rejectedReason TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (channelId) REFERENCES KakaoChannel(id) ON DELETE CASCADE
);

-- Indexes for AlimtalkTemplate
CREATE INDEX IF NOT EXISTS idx_alimtalk_user ON AlimtalkTemplate(userId);
CREATE INDEX IF NOT EXISTS idx_alimtalk_channel ON AlimtalkTemplate(channelId);
CREATE INDEX IF NOT EXISTS idx_alimtalk_status ON AlimtalkTemplate(status);
CREATE INDEX IF NOT EXISTS idx_alimtalk_code ON AlimtalkTemplate(templateCode);

