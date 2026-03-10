-- =============================================
-- Step 4: 일일 사용량 VIEW 생성
-- =============================================

-- 기존 VIEW가 있다면 삭제
DROP VIEW IF EXISTS v_daily_bot_usage;

-- 새 VIEW 생성
CREATE VIEW v_daily_bot_usage AS
SELECT 
  ba.id AS assignmentId,
  ba.botId,
  ba.userId AS studentId,
  ba.dailyUsageLimit,
  DATE('now') AS usageDate,
  COALESCE(SUM(bul.messageCount), 0) AS dailyUsageCount,
  ba.dailyUsageLimit - COALESCE(SUM(bul.messageCount), 0) AS remainingUsage,
  CASE 
    WHEN COALESCE(SUM(bul.messageCount), 0) >= ba.dailyUsageLimit THEN 1
    ELSE 0
  END AS isLimitExceeded
FROM ai_bot_assignments ba
LEFT JOIN bot_usage_logs bul 
  ON ba.id = bul.assignmentId 
  AND DATE(bul.createdAt) = DATE('now')
WHERE ba.status = 'active'
GROUP BY ba.id, ba.botId, ba.userId, ba.dailyUsageLimit;

-- 확인
SELECT COUNT(*) as view_count FROM v_daily_bot_usage;
