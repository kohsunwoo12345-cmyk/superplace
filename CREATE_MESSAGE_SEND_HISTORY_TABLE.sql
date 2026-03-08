-- MessageSendHistory 테이블 생성 (발송 이력 저장)
CREATE TABLE IF NOT EXISTS MessageSendHistory (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  messageType TEXT NOT NULL, -- 'SMS', 'LMS', 'MMS', 'KAKAO'
  senderNumber TEXT NOT NULL,
  recipientCount INTEGER NOT NULL DEFAULT 0,
  recipients TEXT, -- JSON 배열: [{to, studentId, studentName}]
  messageTitle TEXT,
  messageContent TEXT NOT NULL,
  pointsUsed INTEGER NOT NULL DEFAULT 0,
  pointCostPerMessage INTEGER,
  successCount INTEGER NOT NULL DEFAULT 0,
  failCount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENDING', 'COMPLETED', 'FAILED', 'PARTIAL'
  sendResults TEXT, -- JSON 배열: [{to, studentName, status, cost, error}]
  sentAt TEXT,
  scheduledAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_message_send_history_user ON MessageSendHistory(userId);
CREATE INDEX IF NOT EXISTS idx_message_send_history_created ON MessageSendHistory(createdAt);
CREATE INDEX IF NOT EXISTS idx_message_send_history_status ON MessageSendHistory(status);

-- 테이블 확인
SELECT 
  name, 
  sql 
FROM sqlite_master 
WHERE type='table' AND name='MessageSendHistory';
