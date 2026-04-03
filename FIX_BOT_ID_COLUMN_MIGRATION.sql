-- =============================================
-- AI 챗봇 에러 수정: bot_id 컬럼 누락 문제 해결
-- 에러: D1_ERROR: no such column: bot_id at offset 28
-- 
-- 실행 방법:
-- Cloudflare D1 대시보드 > SQL 탭에서 아래 SQL 실행
-- 또는: wrangler d1 execute <DB_NAME> --file=FIX_BOT_ID_COLUMN_MIGRATION.sql
-- =============================================

-- 1. chat_sessions 테이블 botId 컬럼 추가 (없을 경우)
-- 구버전 chat_sessions 테이블에는 botId 컬럼이 없을 수 있음
ALTER TABLE chat_sessions ADD COLUMN botId TEXT DEFAULT '';

-- 2. chat_sessions 테이블 academyId 컬럼 추가 (없을 경우)
ALTER TABLE chat_sessions ADD COLUMN academyId TEXT DEFAULT 'default';

-- 3. chat_sessions 테이블 updatedAt 컬럼 추가 (없을 경우)
ALTER TABLE chat_sessions ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP;

-- 4. ai_chat_logs 테이블 botId 컬럼 추가 (없을 경우)
ALTER TABLE ai_chat_logs ADD COLUMN botId TEXT;

-- 5. ai_chat_logs 테이블 botName 컬럼 추가 (없을 경우)
ALTER TABLE ai_chat_logs ADD COLUMN botName TEXT;

-- 6. bot_usage_logs 테이블 생성 (없을 경우)
CREATE TABLE IF NOT EXISTS bot_usage_logs (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  botId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userType TEXT NOT NULL,
  messageCount INTEGER DEFAULT 1,
  usageDate TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- 7. bot_usage_logs 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_assignment ON bot_usage_logs(assignmentId);
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_user ON bot_usage_logs(userId, usageDate);
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_date ON bot_usage_logs(usageDate);
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_composite ON bot_usage_logs(assignmentId, userId, usageDate);

-- 8. ai_bot_assignments 테이블 dailyUsageLimit 컬럼 추가 (없을 경우)
ALTER TABLE ai_bot_assignments ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;

-- 9. 확인 쿼리
SELECT 'chat_sessions 컬럼 목록:' as info;
PRAGMA table_info(chat_sessions);

SELECT 'ai_chat_logs 컬럼 목록:' as info;
PRAGMA table_info(ai_chat_logs);

SELECT 'bot_usage_logs 컬럼 목록:' as info;
PRAGMA table_info(bot_usage_logs);
