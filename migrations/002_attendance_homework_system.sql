-- 학생 출결 및 숙제 검사 시스템

-- 1. 학생 출석 코드 테이블
CREATE TABLE IF NOT EXISTS student_attendance_codes (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  code TEXT UNIQUE NOT NULL, -- 6자리 고유 코드
  academyId INTEGER,
  classId TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  expiresAt TEXT, -- 코드 만료 시간 (선택적)
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- 2. 출석 기록 테이블
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  attendanceCode TEXT NOT NULL,
  checkInTime TEXT DEFAULT (datetime('now')),
  checkInType TEXT DEFAULT 'CODE', -- CODE, QR, MANUAL
  academyId INTEGER,
  classId TEXT,
  status TEXT DEFAULT 'PRESENT', -- PRESENT, LATE, ABSENT
  note TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- 3. 숙제 제출 테이블
CREATE TABLE IF NOT EXISTS homework_submissions (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  attendanceRecordId TEXT,
  imageUrl TEXT NOT NULL, -- 카메라로 찍은 숙제 이미지
  imageData TEXT, -- Base64 이미지 데이터 (백업용)
  submittedAt TEXT DEFAULT (datetime('now')),
  academyId INTEGER,
  classId TEXT,
  teacherId INTEGER, -- 담당 선생님
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (attendanceRecordId) REFERENCES attendance_records(id)
);

-- 4. AI 숙제 채점 결과 테이블
CREATE TABLE IF NOT EXISTS homework_gradings (
  id TEXT PRIMARY KEY,
  submissionId TEXT NOT NULL,
  userId INTEGER NOT NULL,
  score INTEGER, -- 0-100점
  feedback TEXT, -- AI 피드백
  detectedIssues TEXT, -- JSON 형태로 저장 (문제점 목록)
  strengths TEXT, -- JSON 형태로 저장 (잘한 점 목록)
  suggestions TEXT, -- JSON 형태로 저장 (개선 제안)
  gradedAt TEXT DEFAULT (datetime('now')),
  gradedBy TEXT DEFAULT 'GEMINI_AI',
  model TEXT DEFAULT 'gemini-1.5-pro',
  FOREIGN KEY (submissionId) REFERENCES homework_submissions(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- 5. 리포트 전송 기록 테이블
CREATE TABLE IF NOT EXISTS homework_reports (
  id TEXT PRIMARY KEY,
  submissionId TEXT NOT NULL,
  gradingId TEXT NOT NULL,
  userId INTEGER NOT NULL, -- 학생
  teacherId INTEGER, -- 선생님
  directorId INTEGER, -- 원장
  reportType TEXT NOT NULL, -- TEACHER, DIRECTOR, PARENT
  recipientEmail TEXT,
  sentAt TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'SENT', -- SENT, FAILED, PENDING
  FOREIGN KEY (submissionId) REFERENCES homework_submissions(id),
  FOREIGN KEY (gradingId) REFERENCES homework_gradings(id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_attendance_codes_userId ON student_attendance_codes(userId);
CREATE INDEX IF NOT EXISTS idx_attendance_codes_code ON student_attendance_codes(code);
CREATE INDEX IF NOT EXISTS idx_attendance_records_userId ON attendance_records(userId);
CREATE INDEX IF NOT EXISTS idx_attendance_records_checkInTime ON attendance_records(checkInTime);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_userId ON homework_submissions(userId);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_attendanceRecordId ON homework_submissions(attendanceRecordId);
CREATE INDEX IF NOT EXISTS idx_homework_gradings_submissionId ON homework_gradings(submissionId);
CREATE INDEX IF NOT EXISTS idx_homework_reports_submissionId ON homework_reports(submissionId);
