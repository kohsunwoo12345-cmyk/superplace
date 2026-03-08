-- ===================================================================
-- 슈퍼플레이스 학원 문자 발송 시스템 - 데이터베이스 긴급 수정
-- 실행 위치: Cloudflare D1 Console
-- 경로: https://dash.cloudflare.com/ 
--       → Workers & Pages → superplacestudy → D1 → webapp-production → Console
-- ===================================================================

-- ===================================
-- 1단계: sms_logs 테이블 수정
-- ===================================
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;
SELECT '📋 1단계: sms_logs 테이블 userId 컬럼 추가' as step;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

-- 1-1. 기존 테이블 구조 확인
SELECT '기존 sms_logs 테이블:' as info;
SELECT sql FROM sqlite_master WHERE type='table' AND name='sms_logs';

-- 1-2. 백업 생성
CREATE TABLE IF NOT EXISTS sms_logs_backup_20260308 AS SELECT * FROM sms_logs;
SELECT '✅ 백업 완료: sms_logs_backup_20260308' as status;

-- 1-3. 기존 테이블 삭제
DROP TABLE sms_logs;
SELECT '✅ 기존 테이블 삭제' as status;

-- 1-4. 새 테이블 생성 (userId 포함)
CREATE TABLE sms_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  senderNumber TEXT NOT NULL,
  recipientNumber TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL,
  statusMessage TEXT,
  studentId TEXT,
  studentName TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sms_logs_userId ON sms_logs(userId);
CREATE INDEX idx_sms_logs_createdAt ON sms_logs(createdAt);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);

SELECT '✅ sms_logs 테이블 재생성 완료 (userId 컬럼 포함)' as status;

-- ===================================
-- 2단계: MessageSendHistory 테이블 생성
-- ===================================
SELECT '' as separator;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;
SELECT '📋 2단계: MessageSendHistory 테이블 생성' as step;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

CREATE TABLE IF NOT EXISTS MessageSendHistory (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  userId TEXT NOT NULL,
  messageType TEXT NOT NULL,
  senderNumber TEXT NOT NULL,
  recipientCount INTEGER NOT NULL DEFAULT 0,
  recipients TEXT,
  messageTitle TEXT,
  messageContent TEXT NOT NULL,
  pointsUsed INTEGER NOT NULL DEFAULT 0,
  pointCostPerMessage INTEGER,
  successCount INTEGER NOT NULL DEFAULT 0,
  failCount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  sendResults TEXT,
  sentAt TEXT,
  scheduledAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_message_send_history_user ON MessageSendHistory(userId);
CREATE INDEX IF NOT EXISTS idx_message_send_history_created ON MessageSendHistory(createdAt);
CREATE INDEX IF NOT EXISTS idx_message_send_history_status ON MessageSendHistory(status);

SELECT '✅ MessageSendHistory 테이블 생성 완료' as status;

-- ===================================
-- 3단계: 테이블 확인
-- ===================================
SELECT '' as separator;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;
SELECT '📋 3단계: 테이블 확인' as step;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

-- 3-1. sms_logs 테이블 확인
SELECT '✅ sms_logs 테이블:' as info;
SELECT sql FROM sqlite_master WHERE type='table' AND name='sms_logs';

-- 3-2. MessageSendHistory 테이블 확인
SELECT '' as separator;
SELECT '✅ MessageSendHistory 테이블:' as info;
SELECT sql FROM sqlite_master WHERE type='table' AND name='MessageSendHistory';

-- 3-3. point_transactions 테이블 확인
SELECT '' as separator;
SELECT '✅ point_transactions 테이블:' as info;
SELECT sql FROM sqlite_master WHERE type='table' AND name='point_transactions';

-- ===================================
-- 4단계: 데이터 확인
-- ===================================
SELECT '' as separator;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;
SELECT '📋 4단계: 기존 데이터 확인' as step;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

-- 4-1. SMS 로그 (최근 5건)
SELECT '📱 최근 SMS 로그:' as info;
SELECT id, senderNumber, recipientNumber, status, createdAt 
FROM sms_logs 
ORDER BY createdAt DESC 
LIMIT 5;

-- 4-2. 포인트 트랜잭션 (최근 5건)
SELECT '' as separator;
SELECT '💰 최근 포인트 트랜잭션:' as info;
SELECT id, userId, userEmail, amount, type, description, createdAt 
FROM point_transactions 
ORDER BY createdAt DESC 
LIMIT 5;

-- 4-3. 사용자별 포인트 잔액
SELECT '' as separator;
SELECT '👤 사용자별 포인트 잔액:' as info;
SELECT 
  userId,
  userEmail,
  SUM(amount) as totalPoints,
  COUNT(*) as transactionCount
FROM point_transactions 
GROUP BY userId, userEmail;

-- ===================================
-- 완료!
-- ===================================
SELECT '' as separator;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;
SELECT '🎉 데이터베이스 수정 완료!' as result;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;
SELECT '' as separator;
SELECT '✅ 수정된 테이블:' as summary;
SELECT '  1. sms_logs - userId 컬럼 추가' as item;
SELECT '  2. MessageSendHistory - 발송 이력 저장용 테이블 생성' as item;
SELECT '' as separator;
SELECT '🧪 테스트 방법:' as test;
SELECT '  curl "https://superplacestudy.pages.dev/api/debug/test-send-and-deduct?userId=1&email=wangholy1@naver.com&to=01085328739&from=01087399697"' as command;
