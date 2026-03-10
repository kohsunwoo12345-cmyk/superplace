-- =============================================
-- Step 3: bot_usage_logs 테이블 생성
-- =============================================

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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_assignment ON bot_usage_logs(assignmentId);
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_user ON bot_usage_logs(userId, usageDate);
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_date ON bot_usage_logs(usageDate);
CREATE INDEX IF NOT EXISTS idx_bot_usage_logs_composite ON bot_usage_logs(assignmentId, userId, usageDate);

-- 확인
SELECT COUNT(*) as log_count FROM bot_usage_logs;
