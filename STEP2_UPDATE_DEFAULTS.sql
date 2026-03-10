-- =============================================
-- Step 2: 기존 데이터에 기본값 설정
-- =============================================
-- Step 1이 성공하거나 "duplicate column" 에러 후 실행

UPDATE ai_bot_assignments 
SET dailyUsageLimit = 15 
WHERE dailyUsageLimit IS NULL;

-- 확인
SELECT COUNT(*) as total, 
       COUNT(dailyUsageLimit) as with_limit,
       AVG(dailyUsageLimit) as avg_limit
FROM ai_bot_assignments;
