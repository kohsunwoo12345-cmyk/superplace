-- =============================================
-- Step 1: ai_bot_assignments에 dailyUsageLimit 추가
-- =============================================
-- 이 쿼리만 먼저 실행하세요. 에러가 나면 이미 컬럼이 존재하는 것입니다.

ALTER TABLE ai_bot_assignments ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;
