-- ============================================================================
-- AI 쇼핑몰 마케팅 기능 확장 스키마
-- 실행 일시: 2026-02-24
-- 목적: 할인, 쿠폰, 프로모션 등 마케팅 기능 추가
-- ============================================================================

-- ============================================================================
-- 1단계: StoreProducts 테이블에 마케팅 필드 추가
-- ============================================================================

-- 1.1 할인 관련 필드
-- ALTER TABLE StoreProducts ADD COLUMN discountType TEXT DEFAULT 'none';  -- none, percentage, fixed
-- ALTER TABLE StoreProducts ADD COLUMN discountValue INTEGER DEFAULT 0;   -- 할인율(%) 또는 할인금액(원)
-- ALTER TABLE StoreProducts ADD COLUMN originalPrice INTEGER DEFAULT 0;   -- 원가 (할인 전 가격)

-- 1.2 프로모션 관련 필드
-- ALTER TABLE StoreProducts ADD COLUMN promotionType TEXT DEFAULT 'none'; -- none, 1plus1, 2plus1, gift
-- ALTER TABLE StoreProducts ADD COLUMN promotionDescription TEXT;         -- 프로모션 설명
-- ALTER TABLE StoreProducts ADD COLUMN promotionStartDate TEXT;           -- 프로모션 시작일
-- ALTER TABLE StoreProducts ADD COLUMN promotionEndDate TEXT;             -- 프로모션 종료일

-- 1.3 쿠폰 관련 필드
-- ALTER TABLE StoreProducts ADD COLUMN couponCode TEXT;                   -- 적용 가능한 쿠폰 코드
-- ALTER TABLE StoreProducts ADD COLUMN maxCouponDiscount INTEGER DEFAULT 0; -- 최대 쿠폰 할인액

-- 1.4 재고 및 구매 제한
-- ALTER TABLE StoreProducts ADD COLUMN stockQuantity INTEGER DEFAULT -1;  -- 재고 수량 (-1: 무제한)
-- ALTER TABLE StoreProducts ADD COLUMN maxPurchasePerUser INTEGER DEFAULT -1; -- 1인당 최대 구매 수량
-- ALTER TABLE StoreProducts ADD COLUMN minPurchaseQuantity INTEGER DEFAULT 1; -- 최소 구매 수량

-- 1.5 배지 및 라벨
-- ALTER TABLE StoreProducts ADD COLUMN badges TEXT;                       -- JSON array: ["NEW", "HOT", "BEST"]
-- ALTER TABLE StoreProducts ADD COLUMN isTimeDeal INTEGER DEFAULT 0;      -- 타임딜 여부
-- ALTER TABLE StoreProducts ADD COLUMN timeDealEndDate TEXT;              -- 타임딜 종료일

-- ============================================================================
-- 2단계: Coupons 테이블 생성 (쿠폰 관리)
-- ============================================================================

CREATE TABLE IF NOT EXISTS Coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,                    -- 쿠폰 코드 (예: SUMMER2026)
  name TEXT NOT NULL,                           -- 쿠폰 이름
  description TEXT,                             -- 쿠폰 설명
  discountType TEXT DEFAULT 'percentage',       -- percentage, fixed
  discountValue INTEGER NOT NULL,               -- 할인율(%) 또는 할인금액(원)
  maxDiscountAmount INTEGER DEFAULT 0,          -- 최대 할인 금액 (percentage 타입일 때)
  minPurchaseAmount INTEGER DEFAULT 0,          -- 최소 구매 금액
  applicableProducts TEXT,                      -- JSON array: 적용 가능한 제품 ID 목록
  applicableCategories TEXT,                    -- JSON array: 적용 가능한 카테고리 목록
  usageLimit INTEGER DEFAULT -1,                -- 전체 사용 제한 횟수 (-1: 무제한)
  usageLimitPerUser INTEGER DEFAULT 1,          -- 1인당 사용 제한 횟수
  usedCount INTEGER DEFAULT 0,                  -- 현재까지 사용된 횟수
  validFrom TEXT NOT NULL,                      -- 쿠폰 사용 시작일
  validUntil TEXT NOT NULL,                     -- 쿠폰 사용 종료일
  isActive INTEGER DEFAULT 1,                   -- 활성 여부
  createdBy TEXT,                               -- 생성자 ID
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_coupons_code ON Coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON Coupons(isActive);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON Coupons(validFrom, validUntil);

-- ============================================================================
-- 3단계: CouponUsage 테이블 생성 (쿠폰 사용 내역)
-- ============================================================================

CREATE TABLE IF NOT EXISTS CouponUsage (
  id TEXT PRIMARY KEY,
  couponId TEXT NOT NULL,                       -- 쿠폰 ID
  userId TEXT NOT NULL,                         -- 사용자 ID
  purchaseRequestId TEXT,                       -- 구매 신청 ID (BotPurchaseRequest)
  discountAmount INTEGER NOT NULL,              -- 실제 할인된 금액
  usedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (couponId) REFERENCES Coupons(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON CouponUsage(couponId);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON CouponUsage(userId);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_purchase ON CouponUsage(purchaseRequestId);

-- ============================================================================
-- 4단계: PromotionEvents 테이블 생성 (프로모션 이벤트 관리)
-- ============================================================================

CREATE TABLE IF NOT EXISTS PromotionEvents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,                           -- 프로모션 이름
  description TEXT,                             -- 프로모션 설명
  promotionType TEXT NOT NULL,                  -- discount, 1plus1, 2plus1, gift, bundle
  targetProducts TEXT,                          -- JSON array: 대상 제품 ID 목록
  targetCategories TEXT,                        -- JSON array: 대상 카테고리 목록
  discountType TEXT DEFAULT 'percentage',       -- percentage, fixed
  discountValue INTEGER DEFAULT 0,              -- 할인율 또는 할인 금액
  giftProductId TEXT,                           -- 사은품 제품 ID (gift 타입)
  conditions TEXT,                              -- JSON: 프로모션 조건 (최소 구매 금액 등)
  priority INTEGER DEFAULT 0,                   -- 우선순위 (높을수록 우선)
  startDate TEXT NOT NULL,                      -- 프로모션 시작일
  endDate TEXT NOT NULL,                        -- 프로모션 종료일
  isActive INTEGER DEFAULT 1,                   -- 활성 여부
  bannerImageUrl TEXT,                          -- 배너 이미지 URL
  createdBy TEXT,                               -- 생성자 ID
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_promotion_events_active ON PromotionEvents(isActive);
CREATE INDEX IF NOT EXISTS idx_promotion_events_dates ON PromotionEvents(startDate, endDate);
CREATE INDEX IF NOT EXISTS idx_promotion_events_priority ON PromotionEvents(priority DESC);

-- ============================================================================
-- 5단계: 트리거 생성 (자동 업데이트)
-- ============================================================================

-- 5.1 Coupons updatedAt 자동 업데이트
CREATE TRIGGER IF NOT EXISTS trigger_coupons_updated
AFTER UPDATE ON Coupons
FOR EACH ROW
BEGIN
  UPDATE Coupons 
  SET updatedAt = datetime('now')
  WHERE id = NEW.id;
END;

-- 5.2 PromotionEvents updatedAt 자동 업데이트
CREATE TRIGGER IF NOT EXISTS trigger_promotion_events_updated
AFTER UPDATE ON PromotionEvents
FOR EACH ROW
BEGIN
  UPDATE PromotionEvents 
  SET updatedAt = datetime('now')
  WHERE id = NEW.id;
END;

-- 5.3 쿠폰 사용 시 사용 횟수 자동 증가
CREATE TRIGGER IF NOT EXISTS trigger_coupon_usage_increment
AFTER INSERT ON CouponUsage
FOR EACH ROW
BEGIN
  UPDATE Coupons 
  SET usedCount = usedCount + 1
  WHERE id = NEW.couponId;
END;

-- ============================================================================
-- 6단계: 샘플 데이터 생성 (테스트용)
-- ============================================================================

-- 6.1 샘플 쿠폰 생성
INSERT OR IGNORE INTO Coupons (
  id, code, name, description,
  discountType, discountValue, maxDiscountAmount,
  minPurchaseAmount, usageLimit, usageLimitPerUser,
  validFrom, validUntil, isActive, createdAt, updatedAt
) VALUES 
(
  'coupon_welcome',
  'WELCOME2026',
  '신규 회원 환영 쿠폰',
  '첫 구매 시 10% 할인 (최대 5만원)',
  'percentage',
  10,
  50000,
  0,
  -1,
  1,
  datetime('now'),
  datetime('now', '+30 days'),
  1,
  datetime('now'),
  datetime('now')
),
(
  'coupon_summer',
  'SUMMER50',
  '여름 특가 쿠폰',
  '50,000원 즉시 할인',
  'fixed',
  50000,
  0,
  100000,
  100,
  1,
  datetime('now'),
  datetime('now', '+7 days'),
  1,
  datetime('now'),
  datetime('now')
);

-- 6.2 샘플 프로모션 이벤트 생성
INSERT OR IGNORE INTO PromotionEvents (
  id, name, description, promotionType,
  discountType, discountValue,
  startDate, endDate, isActive, priority,
  createdAt, updatedAt
) VALUES
(
  'promo_1plus1',
  'AI 수학 튜터 1+1 이벤트',
  'AI 수학 튜터 3개월 구매 시 1개월 추가 제공',
  '1plus1',
  'percentage',
  0,
  datetime('now'),
  datetime('now', '+14 days'),
  1,
  10,
  datetime('now'),
  datetime('now')
),
(
  'promo_timedeal',
  '깜짝 타임딜 30% 할인',
  '오늘 하루만! 모든 상품 30% 특가',
  'discount',
  'percentage',
  30,
  datetime('now'),
  datetime('now', '+1 day'),
  1,
  20,
  datetime('now'),
  datetime('now')
);

-- ============================================================================
-- 7단계: 검증 쿼리
-- ============================================================================

-- 7.1 테이블 확인
SELECT 
  '✅ 마케팅 테이블 생성 완료' AS status,
  name AS table_name
FROM sqlite_master 
WHERE type='table' AND name IN (
  'Coupons', 
  'CouponUsage', 
  'PromotionEvents'
)
ORDER BY name;

-- 7.2 샘플 쿠폰 확인
SELECT 
  '📋 샘플 쿠폰' AS info,
  code,
  name,
  discountType,
  discountValue,
  validFrom,
  validUntil
FROM Coupons
WHERE isActive = 1;

-- 7.3 샘플 프로모션 확인
SELECT 
  '🎁 샘플 프로모션' AS info,
  name,
  promotionType,
  discountValue,
  startDate,
  endDate
FROM PromotionEvents
WHERE isActive = 1;

-- ============================================================================
-- 완료 메시지
-- ============================================================================

SELECT 
  '✅ AI 쇼핑몰 마케팅 기능 스키마 생성 완료!' AS status,
  datetime('now', 'localtime') AS completed_at;

/*
🎯 추가된 마케팅 기능:

1. 할인 시스템
   - 정률 할인 (percentage): 10%, 20% 등
   - 정액 할인 (fixed): 10,000원, 50,000원 등
   - 원가 표시 (할인 전 가격)

2. 쿠폰 시스템
   - 쿠폰 코드 발급 (예: SUMMER2026)
   - 최소/최대 구매 금액 조건
   - 사용 횟수 제한
   - 사용 기간 제한
   - 적용 제품/카테고리 지정

3. 프로모션 시스템
   - 1+1, 2+1 이벤트
   - 사은품 증정
   - 타임딜
   - 프로모션 우선순위 관리

4. 배지 시스템
   - NEW, HOT, BEST 배지
   - 타임딜 배지
   - 커스텀 배지

5. 구매 제한
   - 재고 관리
   - 1인당 구매 제한
   - 최소 구매 수량

📊 실행 방법:
wrangler d1 execute DB --remote --file=schema/marketing-features.sql
*/
