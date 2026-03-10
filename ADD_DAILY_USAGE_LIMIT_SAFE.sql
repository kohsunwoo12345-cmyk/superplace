-- =============================================
-- AI 봇 일일 사용 한도 기능 추가 (순서 수정)
-- =============================================

-- Step 1: ai_bot_assignments 테이블에 dailyUsageLimit 컬럼이 있는지 확인
-- 없으면 추가, 있으면 무시됨

-- 먼저 테이블 구조 확인
SELECT sql FROM sqlite_master WHERE type='table' AND name='ai_bot_assignments';

-- Step 2: 컬럼 추가 (이미 있으면 에러 발생하지만 무시 가능)
-- Cloudflare D1은 IF NOT EXISTS를 지원하지 않으므로 에러 무시

ALTER TABLE ai_bot_assignments ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;

-- Step 3: 기존 레코드에 기본값 설정
UPDATE ai_bot_assignments 
SET dailyUsageLimit = 15 
WHERE dailyUsageLimit IS NULL;

-- Step 4: 봇 사용 기록 테이블 생성
CREATE TABLE IF NOT EXISTS bot_usage_logs (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  botId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userType TEXT NOT NULL,
  messageCount INTEGER DEFAULT 1,
  usageDate TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (assignmentId) REFERENCES ai_bot_assignments(id),
  FOREIGN KEY (botId) REFERENCES ai_bots(id)
);

-- Step 5: 인덱스 생성 (이미 있으면 IF NOT EXISTS로 무시)
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_assignment ON bot_usage_logs(assignmentId);
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_user ON bot_usage_logs(userId, usageDate);
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_date ON bot_usage_logs(usageDate);
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_composite ON bot_usage_logs(assignmentId, userId, usageDate);

-- Step 6: 일일 사용량 조회 VIEW 생성
-- DROP VIEW IF EXISTS v_daily_bot_usage;

CREATE VIEW IF NOT EXISTS v_daily_bot_usage AS
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

-- =============================================
-- 검증 쿼리
-- =============================================

-- 1. 테이블 구조 확인
SELECT sql FROM sqlite_master WHERE name='ai_bot_assignments';

-- 2. 컬럼 추가 확인
PRAGMA table_info(ai_bot_assignments);

-- 3. 샘플 데이터 확인
SELECT id, userId, botId, dailyUsageLimit, status 
FROM ai_bot_assignments 
LIMIT 5;

-- 4. bot_usage_logs 테이블 확인
SELECT COUNT(*) as total_logs FROM bot_usage_logs;

-- 5. VIEW 작동 확인
SELECT * FROM v_daily_bot_usage LIMIT 5;
