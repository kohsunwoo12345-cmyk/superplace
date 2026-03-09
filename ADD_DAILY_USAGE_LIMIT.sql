-- =============================================
-- AI 봇 일일 사용 한도 기능 추가
-- =============================================

-- 1. bot_assignments 테이블에 일일 사용 한도 필드 추가
ALTER TABLE bot_assignments ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;

-- 2. 봇 사용 기록 테이블 생성 (일일 사용량 추적)
CREATE TABLE IF NOT EXISTS bot_usage_logs (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  botId TEXT NOT NULL,
  userId TEXT NOT NULL,  -- studentId 또는 directorId
  userType TEXT NOT NULL,  -- 'student' 또는 'director'
  messageCount INTEGER DEFAULT 1,  -- 한 번의 요청에 포함된 메시지 수
  usageDate TEXT NOT NULL,  -- YYYY-MM-DD 형식
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (assignmentId) REFERENCES bot_assignments(id),
  FOREIGN KEY (botId) REFERENCES ai_bots(id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_bot_usage_logs_assignment ON bot_usage_logs(assignmentId);
CREATE INDEX idx_bot_usage_logs_user ON bot_usage_logs(userId, usageDate);
CREATE INDEX idx_bot_usage_logs_date ON bot_usage_logs(usageDate);
CREATE INDEX idx_bot_usage_logs_composite ON bot_usage_logs(assignmentId, userId, usageDate);

-- 3. 일일 사용량 조회 VIEW 생성
CREATE VIEW IF NOT EXISTS v_daily_bot_usage AS
SELECT 
  ba.id AS assignmentId,
  ba.botId,
  ba.studentId,
  ba.dailyUsageLimit,
  DATE(bul.createdAt) AS usageDate,
  COALESCE(SUM(bul.messageCount), 0) AS dailyUsageCount,
  ba.dailyUsageLimit - COALESCE(SUM(bul.messageCount), 0) AS remainingUsage,
  CASE 
    WHEN COALESCE(SUM(bul.messageCount), 0) >= ba.dailyUsageLimit THEN 1
    ELSE 0
  END AS isLimitExceeded
FROM bot_assignments ba
LEFT JOIN bot_usage_logs bul 
  ON ba.id = bul.assignmentId 
  AND DATE(bul.createdAt) = DATE('now')
WHERE ba.isActive = 1
GROUP BY ba.id, ba.botId, ba.studentId, ba.dailyUsageLimit;

-- =============================================
-- 테스트 데이터 (선택사항)
-- =============================================

-- 기존 bot_assignments에 기본 한도 설정 (이미 데이터가 있는 경우)
UPDATE bot_assignments 
SET dailyUsageLimit = 15 
WHERE dailyUsageLimit IS NULL;

-- =============================================
-- 사용량 확인 쿼리 예시
-- =============================================

-- 1. 특정 학생의 특정 봇 오늘 사용량 확인
-- SELECT 
--   assignmentId,
--   botId,
--   studentId,
--   dailyUsageLimit,
--   dailyUsageCount,
--   remainingUsage,
--   isLimitExceeded
-- FROM v_daily_bot_usage
-- WHERE studentId = 'STUDENT_ID_HERE'
--   AND botId = 'BOT_ID_HERE';

-- 2. 특정 assignment의 오늘 사용량 확인
-- SELECT *
-- FROM bot_usage_logs
-- WHERE assignmentId = 'ASSIGNMENT_ID_HERE'
--   AND DATE(createdAt) = DATE('now');

-- 3. 모든 학생의 오늘 사용량 요약
-- SELECT 
--   s.name AS studentName,
--   ab.name AS botName,
--   v.dailyUsageCount,
--   v.dailyUsageLimit,
--   v.remainingUsage,
--   CASE WHEN v.isLimitExceeded = 1 THEN '한도 초과' ELSE '사용 가능' END AS status
-- FROM v_daily_bot_usage v
-- JOIN students s ON v.studentId = s.id
-- JOIN ai_bots ab ON v.botId = ab.id
-- ORDER BY v.dailyUsageCount DESC;

-- =============================================
-- 사용량 기록 삽입 예시 (API에서 호출)
-- =============================================

-- 메시지 전송 시 사용량 기록
-- INSERT INTO bot_usage_logs (
--   id, 
--   assignmentId, 
--   botId, 
--   userId, 
--   userType, 
--   messageCount, 
--   usageDate
-- ) VALUES (
--   'uuid_here',
--   'assignment_id_here',
--   'bot_id_here',
--   'user_id_here',
--   'student',
--   1,
--   DATE('now')
-- );

-- =============================================
-- 한도 체크 함수 (API에서 사용)
-- =============================================

-- 사용 가능 여부 확인 쿼리:
-- SELECT 
--   CASE 
--     WHEN COALESCE(SUM(messageCount), 0) < ba.dailyUsageLimit THEN 1
--     ELSE 0
--   END AS canUse,
--   ba.dailyUsageLimit - COALESCE(SUM(messageCount), 0) AS remaining
-- FROM bot_assignments ba
-- LEFT JOIN bot_usage_logs bul 
--   ON ba.id = bul.assignmentId 
--   AND bul.userId = 'USER_ID_HERE'
--   AND DATE(bul.createdAt) = DATE('now')
-- WHERE ba.id = 'ASSIGNMENT_ID_HERE'
-- GROUP BY ba.id, ba.dailyUsageLimit;
