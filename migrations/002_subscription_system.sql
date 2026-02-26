-- 요금제 시스템 마이그레이션 SQL
-- 2026-02-26: 요금제, 구독, 사용량 추적 테이블 추가

-- 1. 요금제 플랜 테이블
CREATE TABLE IF NOT EXISTS pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- 가격 (기간별, 원화)
  price_1month INTEGER NOT NULL DEFAULT 0,
  price_6months INTEGER NOT NULL DEFAULT 0,
  price_12months INTEGER NOT NULL DEFAULT 0,
  
  -- 제한사항
  max_students INTEGER NOT NULL DEFAULT 10,           -- 학생 수 제한 (-1 = 무제한)
  max_homework_checks INTEGER NOT NULL DEFAULT 100,   -- 월별 숙제 검사 (-1 = 무제한)
  max_ai_analysis INTEGER NOT NULL DEFAULT 50,        -- 월별 AI 역량 분석 (-1 = 무제한)
  max_similar_problems INTEGER NOT NULL DEFAULT 100,  -- 월별 유사문제 출제 (-1 = 무제한)
  max_landing_pages INTEGER NOT NULL DEFAULT 3,       -- 랜딩페이지 제작 (-1 = 무제한)
  
  -- 추가 기능 (JSON array)
  features TEXT,
  
  -- 메타 정보
  isPopular INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  `order` INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON pricing_plans(isActive);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_order ON pricing_plans(`order`);

-- 2. 요금제 신청 테이블
CREATE TABLE IF NOT EXISTS subscription_requests (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userEmail TEXT NOT NULL,
  userName TEXT NOT NULL,
  
  -- 요금제 정보
  planId TEXT NOT NULL,
  planName TEXT NOT NULL,
  period TEXT NOT NULL,  -- '1month' | '6months' | '12months'
  paymentMethod TEXT NOT NULL,  -- 'card' | 'bank_transfer'
  
  -- 가격 정보
  originalPrice INTEGER NOT NULL,
  discountedPrice INTEGER DEFAULT 0,
  finalPrice INTEGER NOT NULL,
  
  -- 결제 정보 (JSON)
  paymentInfo TEXT,
  
  -- 신청 상태
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  adminNote TEXT,
  
  -- 날짜
  requestedAt TEXT NOT NULL DEFAULT (datetime('now')),
  processedAt TEXT,
  
  -- 승인 정보
  approvedBy TEXT,
  approvedByEmail TEXT,
  
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (planId) REFERENCES pricing_plans(id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_requests_user ON subscription_requests(userId);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_date ON subscription_requests(requestedAt DESC);

-- 3. 사용자 구독 정보 테이블
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,  -- 한 사용자당 하나의 활성 구독
  
  -- 요금제 정보
  planId TEXT NOT NULL,
  planName TEXT NOT NULL,
  period TEXT NOT NULL,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'active',  -- 'pending' | 'active' | 'expired' | 'cancelled'
  
  -- 날짜
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  
  -- 현재 사용량 (월별 리셋)
  current_students INTEGER DEFAULT 0,
  current_homework_checks INTEGER DEFAULT 0,
  current_ai_analysis INTEGER DEFAULT 0,
  current_similar_problems INTEGER DEFAULT 0,
  current_landing_pages INTEGER DEFAULT 0,
  
  -- 제한 (현재 플랜 기준)
  max_students INTEGER NOT NULL DEFAULT 10,
  max_homework_checks INTEGER NOT NULL DEFAULT 100,
  max_ai_analysis INTEGER NOT NULL DEFAULT 50,
  max_similar_problems INTEGER NOT NULL DEFAULT 100,
  max_landing_pages INTEGER NOT NULL DEFAULT 3,
  
  -- 결제 정보
  lastPaymentAmount INTEGER DEFAULT 0,
  lastPaymentDate TEXT,
  
  -- 갱신 정보
  autoRenew INTEGER DEFAULT 0,
  
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  -- 사용량 리셋 날짜
  lastResetDate TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (planId) REFERENCES pricing_plans(id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(userId);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(endDate);

-- 4. 사용량 로그 테이블
CREATE TABLE IF NOT EXISTS usage_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  subscriptionId TEXT NOT NULL,
  
  -- 사용 타입
  type TEXT NOT NULL,  -- 'student' | 'homework_check' | 'ai_analysis' | 'similar_problem' | 'landing_page'
  action TEXT NOT NULL,  -- 'create' | 'delete' | 'use'
  
  -- 메타 정보 (JSON)
  metadata TEXT,
  
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (subscriptionId) REFERENCES user_subscriptions(id)
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(userId);
CREATE INDEX IF NOT EXISTS idx_usage_logs_subscription ON usage_logs(subscriptionId);
CREATE INDEX IF NOT EXISTS idx_usage_logs_type ON usage_logs(type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_date ON usage_logs(createdAt DESC);

-- 5. 기본 요금제 데이터 삽입
INSERT OR IGNORE INTO pricing_plans (
  id, name, description,
  price_1month, price_6months, price_12months,
  max_students, max_homework_checks, max_ai_analysis, max_similar_problems, max_landing_pages,
  features, isPopular, color, `order`, isActive
) VALUES 
-- 무료 플랜
(
  'plan-free',
  '무료 플랜',
  '개인 사용자를 위한 무료 플랜',
  0, 0, 0,
  5, 10, 5, 10, 1,
  '["기본 숙제 검사", "제한된 AI 분석", "1개 랜딩페이지"]',
  0, '#gray-500', 1, 1
),
-- 스타터 플랜
(
  'plan-starter',
  '스타터',
  '소규모 학원을 위한 시작 플랜',
  50000, 270000, 480000,
  30, 100, 50, 100, 3,
  '["30명 학생 관리", "월 100회 숙제 검사", "월 50회 AI 분석", "3개 랜딩페이지", "이메일 지원"]',
  0, '#3b82f6', 2, 1
),
-- 프로 플랜 (인기)
(
  'plan-pro',
  '프로',
  '중규모 학원을 위한 추천 플랜',
  100000, 540000, 960000,
  100, 500, 200, 500, 10,
  '["100명 학생 관리", "월 500회 숙제 검사", "월 200회 AI 분석", "10개 랜딩페이지", "우선 지원", "고급 분석"]',
  1, '#8b5cf6', 3, 1
),
-- 엔터프라이즈 플랜
(
  'plan-enterprise',
  '엔터프라이즈',
  '대규모 학원을 위한 맞춤 플랜',
  200000, 1080000, 1920000,
  -1, -1, -1, -1, -1,
  '["무제한 학생", "무제한 숙제 검사", "무제한 AI 분석", "무제한 랜딩페이지", "전담 지원", "맞춤 기능", "API 액세스"]',
  0, '#f59e0b', 4, 1
);

-- 완료 메시지
SELECT 'Subscription system migration completed successfully' AS message;
