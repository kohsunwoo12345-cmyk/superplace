-- ============================================
-- 구독 관리 시스템 테이블 생성 SQL
-- ============================================

-- 1. 기존 테이블 삭제 (있을 경우)
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS subscription_requests;
DROP TABLE IF EXISTS usage_alerts;
DROP TABLE IF EXISTS usage_logs;

-- 2. subscription_requests 테이블 생성
CREATE TABLE subscription_requests (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  planId TEXT NOT NULL,
  planName TEXT NOT NULL,
  period TEXT NOT NULL,
  finalPrice INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  requestedAt TEXT DEFAULT (datetime('now')),
  processedAt TEXT,
  approvedBy TEXT,
  approvedByEmail TEXT,
  adminNote TEXT,
  companyName TEXT,
  businessNumber TEXT,
  requestNote TEXT,
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX idx_subscription_requests_userId ON subscription_requests(userId);
CREATE INDEX idx_subscription_requests_status ON subscription_requests(status);

-- 3. user_subscriptions 테이블 생성 (25개 컬럼)
CREATE TABLE user_subscriptions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  planId TEXT NOT NULL,
  planName TEXT NOT NULL,
  period TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  
  -- 현재 사용량 (5개)
  current_students INTEGER DEFAULT 0,
  current_homework_checks INTEGER DEFAULT 0,
  current_ai_analysis INTEGER DEFAULT 0,
  current_similar_problems INTEGER DEFAULT 0,
  current_landing_pages INTEGER DEFAULT 0,
  
  -- 최대 한도 (5개)
  max_students INTEGER DEFAULT -1,
  max_homework_checks INTEGER DEFAULT -1,
  max_ai_analysis INTEGER DEFAULT -1,
  max_similar_problems INTEGER DEFAULT -1,
  max_landing_pages INTEGER DEFAULT -1,
  
  -- 결제 정보
  lastPaymentAmount INTEGER,
  lastPaymentDate TEXT,
  
  -- 관리 정보
  autoRenew INTEGER DEFAULT 0,
  lastResetDate TEXT,
  
  -- 타임스탬프
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX idx_user_subscriptions_userId ON user_subscriptions(userId);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_endDate ON user_subscriptions(endDate);

-- 4. usage_alerts 테이블 생성
CREATE TABLE usage_alerts (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  threshold INTEGER,
  currentValue INTEGER,
  maxValue INTEGER,
  isRead INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  readAt TEXT
);

CREATE INDEX idx_usage_alerts_academyId ON usage_alerts(academyId);
CREATE INDEX idx_usage_alerts_isRead ON usage_alerts(isRead);

-- 5. usage_logs 테이블 생성
CREATE TABLE usage_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  details TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX idx_usage_logs_userId ON usage_logs(userId);
CREATE INDEX idx_usage_logs_type ON usage_logs(type);
CREATE INDEX idx_usage_logs_createdAt ON usage_logs(createdAt);

-- 6. 생성 확인
SELECT 
  'Tables Created:' as message,
  COUNT(*) as count 
FROM sqlite_master 
WHERE type='table' 
AND name IN ('subscription_requests', 'user_subscriptions', 'usage_alerts', 'usage_logs');

-- 7. user_subscriptions 스키마 확인
PRAGMA table_info(user_subscriptions);
