-- AI 쇼핑몰 제품 구독 시스템 스키마

-- 1. StoreProducts 테이블에 학생당 월 가격 필드 추가
-- (기존 테이블이 있다면 ALTER, 없다면 CREATE)

CREATE TABLE IF NOT EXISTS StoreProducts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  section TEXT,
  description TEXT,
  shortDescription TEXT,
  price INTEGER DEFAULT 0,
  monthlyPrice INTEGER DEFAULT 0,          -- 기존: 월 구독 가격
  yearlyPrice INTEGER DEFAULT 0,           -- 기존: 연 구독 가격
  pricePerStudent INTEGER DEFAULT 0,       -- 🆕 학생당 월 가격 (예: 990원)
  features TEXT,                           -- JSON array
  detailHtml TEXT,
  imageUrl TEXT,
  botId TEXT,
  isActive INTEGER DEFAULT 1,
  isFeatured INTEGER DEFAULT 0,
  displayOrder INTEGER DEFAULT 0,
  keywords TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 2. BotPurchaseRequest 테이블 (구매 신청)
CREATE TABLE IF NOT EXISTS BotPurchaseRequest (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,              -- 구매하는 제품 ID
  productName TEXT NOT NULL,
  userId TEXT NOT NULL,                 -- 구매 신청자 (학원장)
  academyId TEXT NOT NULL,              -- 학원 ID
  studentCount INTEGER NOT NULL,        -- 구매할 학생 수
  months INTEGER NOT NULL,              -- 구매 개월 수
  pricePerStudent INTEGER NOT NULL,     -- 학생당 월 가격
  totalPrice INTEGER NOT NULL,          -- 총 금액 = studentCount * months * pricePerStudent
  depositBank TEXT,                     -- 입금 은행
  depositorName TEXT,                   -- 입금자명
  attachmentUrl TEXT,                   -- 입금 증빙
  requestMessage TEXT,                  -- 신청 메시지
  status TEXT DEFAULT 'PENDING',        -- PENDING, APPROVED, REJECTED
  approvedBy TEXT,                      -- 승인자 ID
  approvedAt TEXT,                      -- 승인 일시
  rejectionReason TEXT,                 -- 거절 사유
  subscriptionStartDate TEXT,           -- 구독 시작일
  subscriptionEndDate TEXT,             -- 구독 종료일
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (productId) REFERENCES StoreProducts(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- 3. AcademyBotSubscription 테이블 (학원별 구독 정보)
CREATE TABLE IF NOT EXISTS AcademyBotSubscription (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,              -- 학원 ID
  productId TEXT NOT NULL,              -- 구독한 제품 ID
  productName TEXT NOT NULL,
  purchaseRequestId TEXT NOT NULL,      -- 구매 신청 ID (참조)
  totalStudentSlots INTEGER NOT NULL,   -- 총 할당 가능 학생 수
  usedStudentSlots INTEGER DEFAULT 0,   -- 현재 사용 중인 학생 수
  remainingStudentSlots INTEGER NOT NULL, -- 남은 할당 가능 학생 수
  subscriptionStartDate TEXT NOT NULL,  -- 구독 시작일
  subscriptionEndDate TEXT NOT NULL,    -- 구독 종료일
  isActive INTEGER DEFAULT 1,           -- 활성 여부 (만료 시 0)
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (academyId) REFERENCES Academy(id),
  FOREIGN KEY (productId) REFERENCES StoreProducts(id),
  FOREIGN KEY (purchaseRequestId) REFERENCES BotPurchaseRequest(id)
);

-- 4. BotAssignment 테이블에 구독 참조 추가
-- (기존 테이블이 있다면 ALTER로 컬럼 추가)
-- ALTER TABLE BotAssignments ADD COLUMN subscriptionId TEXT;

CREATE TABLE IF NOT EXISTS BotAssignments (
  id TEXT PRIMARY KEY,
  botId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  subscriptionId TEXT,                  -- 🆕 구독 ID 참조
  assignedBy TEXT,
  assignedAt TEXT NOT NULL,
  expiresAt TEXT,                       -- 구독 만료일
  isActive INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (botId) REFERENCES AIBots(id),
  FOREIGN KEY (studentId) REFERENCES users(id),
  FOREIGN KEY (subscriptionId) REFERENCES AcademyBotSubscription(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bot_purchase_request_academy ON BotPurchaseRequest(academyId);
CREATE INDEX IF NOT EXISTS idx_bot_purchase_request_status ON BotPurchaseRequest(status);
CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_academy ON AcademyBotSubscription(academyId);
CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_active ON AcademyBotSubscription(isActive);
CREATE INDEX IF NOT EXISTS idx_bot_assignments_subscription ON BotAssignments(subscriptionId);
