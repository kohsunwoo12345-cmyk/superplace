-- ═══════════════════════════════════════════════════════════════════════════
-- BotPurchaseRequest 테이블 마이그레이션
-- 
-- 목적: email, name, requestAcademyName, phoneNumber 컬럼 추가
-- 실행 위치: Cloudflare D1 Console
-- ═══════════════════════════════════════════════════════════════════════════

-- 1️⃣  현재 테이블 구조 확인 (실행 전)
PRAGMA table_info(BotPurchaseRequest);

-- 2️⃣  email 컬럼 추가
ALTER TABLE BotPurchaseRequest ADD COLUMN email TEXT;

-- 3️⃣  name 컬럼 추가
ALTER TABLE BotPurchaseRequest ADD COLUMN name TEXT;

-- 4️⃣  requestAcademyName 컬럼 추가
ALTER TABLE BotPurchaseRequest ADD COLUMN requestAcademyName TEXT;

-- 5️⃣  phoneNumber 컬럼 추가
ALTER TABLE BotPurchaseRequest ADD COLUMN phoneNumber TEXT;

-- 6️⃣  최종 테이블 구조 확인 (실행 후)
PRAGMA table_info(BotPurchaseRequest);

-- ═══════════════════════════════════════════════════════════════════════════
-- 실행 방법:
-- 
-- 1. Cloudflare Dashboard 접속: https://dash.cloudflare.com
-- 2. Workers & Pages → superplacestudy → Settings → Bindings
-- 3. D1 database → "Open console" 클릭
-- 4. 위 SQL을 **한 줄씩** 복사 & 붙여넣기 & 실행
-- 5. 마지막 PRAGMA 출력에서 email, name, requestAcademyName, phoneNumber 확인
--
-- ⚠️  주의: "duplicate column name" 오류는 무시 (이미 추가된 컬럼)
-- ═══════════════════════════════════════════════════════════════════════════

-- ✅ 성공 후:
-- 1. https://superplacestudy.pages.dev/store 에서 구매 신청
-- 2. https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals 에서 확인
