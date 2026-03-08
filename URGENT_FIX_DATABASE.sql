-- ===================================
-- 긴급 수정: 발송 이력 및 포인트 차감 문제 해결
-- ===================================

-- 1. MessageSendHistory 테이블 생성 (발송 이력 저장용)
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

-- 2. 테이블 확인
SELECT '✅ MessageSendHistory 테이블 생성 완료' as status;
SELECT name, sql FROM sqlite_master WHERE type='table' AND name='MessageSendHistory';

-- 3. point_transactions 테이블 확인
SELECT '📊 point_transactions 테이블 확인' as status;
SELECT name, sql FROM sqlite_master WHERE type='table' AND name='point_transactions';

-- 4. sms_logs 테이블 확인
SELECT '📱 sms_logs 테이블 확인' as status;
SELECT name, sql FROM sqlite_master WHERE type='table' AND name='sms_logs';

-- 5. 최근 SMS 발송 로그 확인 (최근 10건)
SELECT '📋 최근 SMS 발송 로그' as status;
SELECT 
  id,
  userId,
  senderNumber,
  recipientNumber,
  status,
  statusMessage,
  studentName,
  createdAt
FROM sms_logs 
ORDER BY createdAt DESC 
LIMIT 10;

-- 6. 포인트 트랜잭션 확인 (최근 10건)
SELECT '💰 최근 포인트 트랜잭션' as status;
SELECT 
  id,
  userId,
  userEmail,
  amount,
  type,
  description,
  createdAt
FROM point_transactions 
ORDER BY createdAt DESC 
LIMIT 10;

-- 7. 사용자별 포인트 합계
SELECT '👤 사용자별 포인트 잔액' as status;
SELECT 
  userId,
  userEmail,
  SUM(amount) as totalPoints,
  COUNT(*) as transactionCount
FROM point_transactions 
GROUP BY userId, userEmail;
