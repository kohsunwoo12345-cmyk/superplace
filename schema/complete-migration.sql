-- ============================================================================
-- AI 쇼핑몰 구독 시스템 완전 마이그레이션 스크립트
-- 실행 일시: 2026-02-24
-- 목적: 구독 기반 AI 봇 할당 시스템 구축
-- ============================================================================

-- ============================================================================
-- 1단계: 기존 테이블 존재 확인 및 스키마 검증
-- ============================================================================

-- 1.1 StoreProducts 테이블 확인
SELECT 
    name AS table_name,
    sql AS create_statement
FROM sqlite_master 
WHERE type='table' AND name='StoreProducts';

-- 1.2 User 테이블 확인 (또는 Users)
SELECT 
    name AS table_name,
    sql AS create_statement
FROM sqlite_master 
WHERE type='table' AND (name='User' OR name='Users');

-- 1.3 Academy 테이블 확인 (또는 Academies)
SELECT 
    name AS table_name,
    sql AS create_statement
FROM sqlite_master 
WHERE type='table' AND (name='Academy' OR name='Academies');

-- 1.4 ai_bots 테이블 확인 (또는 AIBots)
SELECT 
    name AS table_name,
    sql AS create_statement
FROM sqlite_master 
WHERE type='table' AND (name='ai_bots' OR name='AIBots');

-- ============================================================================
-- 2단계: StoreProducts 테이블 처리
-- ============================================================================

-- 2.1 StoreProducts 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS StoreProducts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  section TEXT,
  description TEXT,
  shortDescription TEXT,
  price INTEGER DEFAULT 0,
  monthlyPrice INTEGER DEFAULT 0,
  yearlyPrice INTEGER DEFAULT 0,
  pricePerStudent INTEGER DEFAULT 0,       -- 🆕 학생당 월 가격
  features TEXT,
  detailHtml TEXT,
  imageUrl TEXT,
  botId TEXT,
  isActive INTEGER DEFAULT 1,
  isFeatured INTEGER DEFAULT 0,
  displayOrder INTEGER DEFAULT 0,
  keywords TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2.2 pricePerStudent 컬럼이 없으면 추가 (이미 있으면 무시)
-- SQLite는 IF NOT EXISTS를 ALTER TABLE에서 지원하지 않으므로 
-- 실행 시 에러 무시 필요 (이미 존재하면 에러 발생)
-- ALTER TABLE StoreProducts ADD COLUMN pricePerStudent INTEGER DEFAULT 0;

-- ============================================================================
-- 3단계: BotPurchaseRequest 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS BotPurchaseRequest (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  userId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  studentCount INTEGER NOT NULL,
  months INTEGER NOT NULL,
  pricePerStudent INTEGER NOT NULL,
  totalPrice INTEGER NOT NULL,
  depositBank TEXT,
  depositorName TEXT,
  attachmentUrl TEXT,
  requestMessage TEXT,
  status TEXT DEFAULT 'PENDING',
  approvedBy TEXT,
  approvedAt TEXT,
  rejectedBy TEXT,
  rejectedAt TEXT,
  rejectionReason TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bot_purchase_request_academy 
  ON BotPurchaseRequest(academyId);

CREATE INDEX IF NOT EXISTS idx_bot_purchase_request_status 
  ON BotPurchaseRequest(status);

CREATE INDEX IF NOT EXISTS idx_bot_purchase_request_product 
  ON BotPurchaseRequest(productId);

CREATE INDEX IF NOT EXISTS idx_bot_purchase_request_created 
  ON BotPurchaseRequest(createdAt DESC);

-- ============================================================================
-- 4단계: AcademyBotSubscription 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS AcademyBotSubscription (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  totalStudentSlots INTEGER NOT NULL,
  usedStudentSlots INTEGER DEFAULT 0,
  remainingStudentSlots INTEGER NOT NULL,
  subscriptionStart TEXT NOT NULL,
  subscriptionEnd TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_academy 
  ON AcademyBotSubscription(academyId);

CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_product 
  ON AcademyBotSubscription(productId);

CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_active 
  ON AcademyBotSubscription(isActive);

CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_end 
  ON AcademyBotSubscription(subscriptionEnd);

-- 복합 인덱스 (학원 + 제품)
CREATE INDEX IF NOT EXISTS idx_academy_bot_subscription_academy_product 
  ON AcademyBotSubscription(academyId, productId);

-- ============================================================================
-- 5단계: BotAssignments 테이블 생성 (참조용)
-- ============================================================================

CREATE TABLE IF NOT EXISTS BotAssignments (
  id TEXT PRIMARY KEY,
  botId TEXT NOT NULL,
  userId TEXT NOT NULL,
  academyId TEXT,
  subscriptionId TEXT,
  assignedBy TEXT,
  assignedAt TEXT NOT NULL DEFAULT (datetime('now')),
  expiresAt TEXT,
  status TEXT DEFAULT 'active',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bot_assignments_bot 
  ON BotAssignments(botId);

CREATE INDEX IF NOT EXISTS idx_bot_assignments_user 
  ON BotAssignments(userId);

CREATE INDEX IF NOT EXISTS idx_bot_assignments_academy 
  ON BotAssignments(academyId);

CREATE INDEX IF NOT EXISTS idx_bot_assignments_subscription 
  ON BotAssignments(subscriptionId);

CREATE INDEX IF NOT EXISTS idx_bot_assignments_status 
  ON BotAssignments(status);

-- ============================================================================
-- 6단계: 트리거 생성 (자동 업데이트)
-- ============================================================================

-- 6.1 BotPurchaseRequest updatedAt 자동 업데이트
CREATE TRIGGER IF NOT EXISTS trigger_bot_purchase_request_updated
AFTER UPDATE ON BotPurchaseRequest
FOR EACH ROW
BEGIN
  UPDATE BotPurchaseRequest 
  SET updatedAt = datetime('now')
  WHERE id = NEW.id;
END;

-- 6.2 AcademyBotSubscription updatedAt 자동 업데이트
CREATE TRIGGER IF NOT EXISTS trigger_academy_bot_subscription_updated
AFTER UPDATE ON AcademyBotSubscription
FOR EACH ROW
BEGIN
  UPDATE AcademyBotSubscription 
  SET updatedAt = datetime('now')
  WHERE id = NEW.id;
END;

-- 6.3 AcademyBotSubscription 만료 체크 (subscriptionEnd < 현재)
CREATE TRIGGER IF NOT EXISTS trigger_academy_bot_subscription_expire
AFTER UPDATE ON AcademyBotSubscription
FOR EACH ROW
WHEN NEW.subscriptionEnd < datetime('now') AND NEW.isActive = 1
BEGIN
  UPDATE AcademyBotSubscription 
  SET isActive = 0
  WHERE id = NEW.id;
END;

-- ============================================================================
-- 7단계: 데이터 검증 및 통계
-- ============================================================================

-- 7.1 테이블 존재 확인
SELECT 
  '✅ 테이블 생성 완료' AS status,
  name AS table_name
FROM sqlite_master 
WHERE type='table' AND name IN (
  'StoreProducts', 
  'BotPurchaseRequest', 
  'AcademyBotSubscription',
  'BotAssignments'
)
ORDER BY name;

-- 7.2 인덱스 확인
SELECT 
  '✅ 인덱스 생성 완료' AS status,
  name AS index_name,
  tbl_name AS table_name
FROM sqlite_master 
WHERE type='index' 
  AND name LIKE 'idx_%'
  AND tbl_name IN (
    'BotPurchaseRequest', 
    'AcademyBotSubscription',
    'BotAssignments'
  )
ORDER BY tbl_name, name;

-- 7.3 트리거 확인
SELECT 
  '✅ 트리거 생성 완료' AS status,
  name AS trigger_name,
  tbl_name AS table_name
FROM sqlite_master 
WHERE type='trigger'
  AND name LIKE 'trigger_%'
ORDER BY tbl_name, name;

-- 7.4 테이블 데이터 카운트
SELECT 
  '📊 StoreProducts' AS table_name,
  COUNT(*) AS record_count
FROM StoreProducts
UNION ALL
SELECT 
  '📊 BotPurchaseRequest' AS table_name,
  COUNT(*) AS record_count
FROM BotPurchaseRequest
UNION ALL
SELECT 
  '📊 AcademyBotSubscription' AS table_name,
  COUNT(*) AS record_count
FROM AcademyBotSubscription
UNION ALL
SELECT 
  '📊 BotAssignments' AS table_name,
  COUNT(*) AS record_count
FROM BotAssignments;

-- ============================================================================
-- 8단계: 샘플 데이터 생성 (테스트용 - 선택사항)
-- ============================================================================

-- 8.1 테스트용 AI 봇 제품 생성 (이미 있으면 무시)
INSERT OR IGNORE INTO StoreProducts (
  id, name, category, description, pricePerStudent,
  isActive, isFeatured, createdAt, updatedAt
) VALUES (
  'test_bot_001',
  'AI 수학 튜터 (테스트)',
  'education',
  '수학 학습을 도와주는 AI 봇입니다.',
  990,
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- ============================================================================
-- 완료 메시지
-- ============================================================================

SELECT 
  '✅ AI 쇼핑몰 구독 시스템 마이그레이션 완료!' AS status,
  datetime('now', 'localtime') AS completed_at;

SELECT 
  '📋 다음 단계: Cloudflare D1에 이 스크립트를 실행하세요.' AS next_step,
  'wrangler d1 execute DB --file=schema/complete-migration.sql' AS command;

-- ============================================================================
-- 주의사항 및 실행 가이드
-- ============================================================================

/*
🔧 실행 방법:

1. 로컬 테스트:
   wrangler d1 execute DB --local --file=schema/complete-migration.sql

2. 프로덕션 배포:
   wrangler d1 execute DB --remote --file=schema/complete-migration.sql

3. 스키마 확인:
   wrangler d1 execute DB --command="SELECT name, sql FROM sqlite_master WHERE type='table'"

4. 데이터 확인:
   wrangler d1 execute DB --command="SELECT * FROM BotPurchaseRequest LIMIT 5"

⚠️ 주의사항:
- 프로덕션 배포 전 반드시 로컬에서 테스트
- 기존 데이터가 있는 경우 백업 필수
- ALTER TABLE 명령은 수동으로 실행 필요 (에러 발생 가능)

📊 테이블 구조:
- StoreProducts: AI 봇 제품 정보 (pricePerStudent 추가)
- BotPurchaseRequest: 학원장의 구매 신청
- AcademyBotSubscription: 학원별 구독 정보 (슬롯 관리)
- BotAssignments: 학생별 봇 할당 내역

🔗 관계:
BotPurchaseRequest --승인--> AcademyBotSubscription --참조--> BotAssignments
        ↓                              ↓                           ↓
   학원장 신청                    학원 슬롯 관리              학생 개별 할당
*/
