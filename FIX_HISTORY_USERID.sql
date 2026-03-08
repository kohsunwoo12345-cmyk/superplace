-- ===================================
-- 발송 이력 userId 수정 SQL
-- ===================================
-- 문제: 테스트 데이터가 userId = "1"로 저장되어 있어서
--      실제 사용자 (user-1771479246368-du957iw33)의 이력이 조회되지 않음
-- 
-- 해결: 테스트 데이터를 삭제하거나 실제 발송을 진행

-- 옵션 1: 테스트 데이터 삭제 (권장)
DELETE FROM MessageSendHistory WHERE userId = '1';

-- 옵션 2: 테스트 데이터의 userId를 실제 사용자 ID로 변경
-- UPDATE MessageSendHistory 
-- SET userId = 'user-1771479246368-du957iw33' 
-- WHERE userId = '1';

-- 확인: MessageSendHistory 테이블의 모든 레코드 조회
SELECT 
  id,
  userId,
  messageType,
  senderNumber,
  recipientCount,
  pointsUsed,
  status,
  createdAt
FROM MessageSendHistory
ORDER BY createdAt DESC;

-- SMS 로그 확인 (userId 컬럼이 있는지 확인)
SELECT * FROM sms_logs ORDER BY createdAt DESC LIMIT 5;

-- 포인트 트랜잭션 확인
SELECT 
  userId,
  userEmail,
  amount,
  type,
  description,
  createdAt
FROM point_transactions
ORDER BY createdAt DESC
LIMIT 10;
