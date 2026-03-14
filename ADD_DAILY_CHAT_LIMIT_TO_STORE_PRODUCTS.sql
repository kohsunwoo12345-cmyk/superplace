-- ===================================================================
-- 스토어 제품에 일일 채팅 제한 필드 추가
-- ===================================================================
-- 파일명: ADD_DAILY_CHAT_LIMIT_TO_STORE_PRODUCTS.sql
-- 작성일: 2026-03-14
-- 설명: StoreProducts 테이블에 dailyChatLimit 컬럼 추가
--       각 구매 제품마다 학생별 하루 채팅 제한을 설정할 수 있습니다.
-- ===================================================================

-- 1. StoreProducts 테이블에 dailyChatLimit 컬럼 추가
-- ===================================================================
ALTER TABLE StoreProducts 
ADD COLUMN dailyChatLimit INTEGER DEFAULT 15;

-- 2. 기존 제품들의 dailyChatLimit 기본값 설정 (15개)
-- ===================================================================
UPDATE StoreProducts 
SET dailyChatLimit = 15 
WHERE dailyChatLimit IS NULL;

-- 3. 확인 쿼리
-- ===================================================================
SELECT id, name, dailyChatLimit, pricePerStudent, monthlyPrice
FROM StoreProducts
ORDER BY createdAt DESC
LIMIT 10;

-- ===================================================================
-- 사용 방법:
-- 1. Cloudflare D1 대시보드에서 실행
-- 2. 또는 CLI: wrangler d1 execute YOUR_DB --file=ADD_DAILY_CHAT_LIMIT_TO_STORE_PRODUCTS.sql
-- 
-- 참고:
-- - dailyChatLimit: 학생 한 명당 하루 최대 채팅 개수
-- - 기본값: 15개
-- - 0 또는 NULL: 제한 없음으로 처리 가능
-- ===================================================================
