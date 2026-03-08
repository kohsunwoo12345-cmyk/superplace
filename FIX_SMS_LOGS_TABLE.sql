-- ===================================
-- 긴급 스키마 수정: sms_logs 테이블 컬럼 추가
-- ===================================

-- 1. 기존 sms_logs 테이블 확인
SELECT '📊 기존 sms_logs 테이블 구조' as info;
SELECT sql FROM sqlite_master WHERE type='table' AND name='sms_logs';

-- 2. sms_logs 테이블 백업
CREATE TABLE IF NOT EXISTS sms_logs_backup AS SELECT * FROM sms_logs;
SELECT '✅ sms_logs 백업 완료' as info;

-- 3. 기존 테이블 삭제
DROP TABLE IF EXISTS sms_logs;
SELECT '✅ 기존 sms_logs 테이블 삭제' as info;

-- 4. 새 스키마로 sms_logs 테이블 재생성
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

-- 인덱스 생성
CREATE INDEX idx_sms_logs_userId ON sms_logs(userId);
CREATE INDEX idx_sms_logs_createdAt ON sms_logs(createdAt);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);

SELECT '✅ sms_logs 테이블 재생성 완료 (userId 컬럼 포함)' as info;

-- 5. 백업 데이터 복원 (컬럼이 있다면)
-- 주의: 백업 테이블에 userId 컬럼이 없으면 이 단계는 실패할 수 있습니다
-- INSERT INTO sms_logs SELECT * FROM sms_logs_backup;
SELECT '⚠️ 백업 데이터는 수동으로 복원하거나 userId 기본값을 지정하여 복원하세요' as warning;

-- 6. 새 스키마 확인
SELECT '📊 새 sms_logs 테이블 구조' as info;
SELECT sql FROM sqlite_master WHERE type='table' AND name='sms_logs';
