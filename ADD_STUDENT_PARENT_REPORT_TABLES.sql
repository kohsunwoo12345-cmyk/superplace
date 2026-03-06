-- =============================================
-- 학생-학부모-리포트 연결 테이블 추가
-- =============================================

-- Parents (학부모) 테이블
CREATE TABLE IF NOT EXISTS parents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  academyId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id)
);

CREATE INDEX IF NOT EXISTS idx_parents_phone ON parents(phone);
CREATE INDEX IF NOT EXISTS idx_parents_academyId ON parents(academyId);

-- Student_Parents (학생-학부모 연결) 테이블
-- 한 학생은 여러 학부모를 가질 수 있음 (아버지, 어머니 등)
CREATE TABLE IF NOT EXISTS student_parents (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  parentId TEXT NOT NULL,
  relationship TEXT DEFAULT 'PARENT', -- FATHER, MOTHER, GUARDIAN, etc.
  isPrimary INTEGER DEFAULT 0, -- 주 연락처 여부
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (parentId) REFERENCES parents(id) ON DELETE CASCADE,
  UNIQUE(studentId, parentId)
);

CREATE INDEX IF NOT EXISTS idx_student_parents_studentId ON student_parents(studentId);
CREATE INDEX IF NOT EXISTS idx_student_parents_parentId ON student_parents(parentId);

-- Student_Reports (학생 리포트) 테이블
-- 각 학생마다 생성된 랜딩페이지(리포트)를 저장
CREATE TABLE IF NOT EXISTS student_reports (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  studentEmail TEXT NOT NULL, -- 학생 고유 이메일 (엑셀 업로드 시 사용)
  landingPageId TEXT NOT NULL,
  landingPageUrl TEXT NOT NULL,
  title TEXT,
  academyId TEXT NOT NULL,
  createdBy TEXT, -- 생성한 사용자 ID
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (landingPageId) REFERENCES landing_pages(id) ON DELETE CASCADE,
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_student_reports_studentId ON student_reports(studentId);
CREATE INDEX IF NOT EXISTS idx_student_reports_studentEmail ON student_reports(studentEmail);
CREATE INDEX IF NOT EXISTS idx_student_reports_landingPageId ON student_reports(landingPageId);
CREATE INDEX IF NOT EXISTS idx_student_reports_academyId ON student_reports(academyId);
CREATE INDEX IF NOT EXISTS idx_student_reports_createdAt ON student_reports(createdAt);

-- Alimtalk_Send_History (알림톡 발송 이력) 테이블
CREATE TABLE IF NOT EXISTS alimtalk_send_history (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL, -- 발송한 사용자
  academyId TEXT NOT NULL,
  channelId TEXT NOT NULL,
  templateId TEXT NOT NULL,
  templateCode TEXT NOT NULL, -- Solapi 템플릿 ID
  recipientCount INTEGER DEFAULT 0,
  successCount INTEGER DEFAULT 0,
  failCount INTEGER DEFAULT 0,
  pointsUsed INTEGER DEFAULT 0,
  sendData TEXT, -- JSON: 전체 발송 데이터
  solapiResponse TEXT, -- JSON: Solapi API 응답
  status TEXT DEFAULT 'PENDING', -- PENDING, SUCCESS, PARTIAL, FAILED
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academy(id)
);

CREATE INDEX IF NOT EXISTS idx_alimtalk_send_history_userId ON alimtalk_send_history(userId);
CREATE INDEX IF NOT EXISTS idx_alimtalk_send_history_academyId ON alimtalk_send_history(academyId);
CREATE INDEX IF NOT EXISTS idx_alimtalk_send_history_createdAt ON alimtalk_send_history(createdAt);

-- Alimtalk_Recipients (알림톡 수신자 상세) 테이블
CREATE TABLE IF NOT EXISTS alimtalk_recipients (
  id TEXT PRIMARY KEY,
  sendHistoryId TEXT NOT NULL, -- 발송 이력 ID
  studentId TEXT, -- 학생 ID (있는 경우)
  studentEmail TEXT, -- 학생 이메일 (엑셀 업로드 시)
  parentId TEXT, -- 학부모 ID (있는 경우)
  recipientName TEXT NOT NULL,
  recipientPhone TEXT NOT NULL,
  landingPageUrl TEXT, -- 개인화된 랜딩페이지 URL
  templateContent TEXT, -- 치환된 최종 메시지 내용
  solapiMessageId TEXT, -- Solapi 메시지 ID
  status TEXT DEFAULT 'SENT', -- SENT, DELIVERED, FAILED
  sentAt TEXT DEFAULT (datetime('now')),
  deliveredAt TEXT,
  failReason TEXT,
  FOREIGN KEY (sendHistoryId) REFERENCES alimtalk_send_history(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (parentId) REFERENCES parents(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alimtalk_recipients_sendHistoryId ON alimtalk_recipients(sendHistoryId);
CREATE INDEX IF NOT EXISTS idx_alimtalk_recipients_studentId ON alimtalk_recipients(studentId);
CREATE INDEX IF NOT EXISTS idx_alimtalk_recipients_studentEmail ON alimtalk_recipients(studentEmail);
CREATE INDEX IF NOT EXISTS idx_alimtalk_recipients_parentId ON alimtalk_recipients(parentId);
CREATE INDEX IF NOT EXISTS idx_alimtalk_recipients_status ON alimtalk_recipients(status);

-- =============================================
-- 학생 테이블에 고유 이메일 컬럼 추가 (없는 경우)
-- =============================================
ALTER TABLE students ADD COLUMN uniqueEmail TEXT;
CREATE INDEX IF NOT EXISTS idx_students_uniqueEmail ON students(uniqueEmail);

-- =============================================
-- 뷰(View) 생성: 학생-학부모-최신리포트 조회
-- =============================================
CREATE VIEW IF NOT EXISTS v_student_parent_latest_report AS
SELECT 
  s.id AS studentId,
  s.uniqueEmail AS studentEmail,
  u.name AS studentName,
  u.email AS studentLoginEmail,
  s.parentPhone,
  s.parentEmail,
  p.id AS parentId,
  p.name AS parentName,
  p.phone AS parentPhone,
  sp.relationship AS parentRelationship,
  sp.isPrimary AS isPrimaryParent,
  sr.id AS reportId,
  sr.landingPageId,
  sr.landingPageUrl,
  sr.title AS reportTitle,
  sr.createdAt AS reportCreatedAt,
  s.academyId
FROM students s
LEFT JOIN users u ON s.userId = u.id
LEFT JOIN student_parents sp ON s.id = sp.studentId
LEFT JOIN parents p ON sp.parentId = p.id
LEFT JOIN (
  -- 각 학생의 가장 최근 리포트만 가져오기
  SELECT sr1.*
  FROM student_reports sr1
  INNER JOIN (
    SELECT studentId, MAX(createdAt) AS maxCreatedAt
    FROM student_reports
    WHERE isActive = 1
    GROUP BY studentId
  ) sr2 ON sr1.studentId = sr2.studentId AND sr1.createdAt = sr2.maxCreatedAt
  WHERE sr1.isActive = 1
) sr ON s.id = sr.studentId
WHERE s.status = 'ACTIVE';

-- =============================================
-- 완료 메시지
-- =============================================
SELECT '✅ 학생-학부모-리포트 연결 테이블 생성 완료!' AS result;
