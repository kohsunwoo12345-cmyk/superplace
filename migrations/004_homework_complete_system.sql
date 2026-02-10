-- ============================================
-- 숙제 시스템 통합 마이그레이션
-- ============================================

-- 1. 숙제 과제 테이블 (선생님이 학생에게 부여하는 숙제)
CREATE TABLE IF NOT EXISTS homework_assignments (
  id TEXT PRIMARY KEY,
  teacherId INTEGER NOT NULL,
  teacherName TEXT NOT NULL,
  academyId INTEGER,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  subject TEXT,
  dueDate TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, archived
  targetType TEXT DEFAULT 'all', -- all, specific
  FOREIGN KEY (teacherId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academies(id)
);

-- 2. 숙제 과제 대상 학생 테이블 (특정 학생에게만 부여할 때)
CREATE TABLE IF NOT EXISTS homework_assignment_targets (
  id TEXT PRIMARY KEY,
  assignmentId TEXT NOT NULL,
  studentId INTEGER NOT NULL,
  studentName TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, submitted, graded
  submissionId TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (assignmentId) REFERENCES homework_assignments(id),
  FOREIGN KEY (studentId) REFERENCES users(id),
  FOREIGN KEY (submissionId) REFERENCES homework_submissions(id)
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_homework_assignments_teacher ON homework_assignments(teacherId);
CREATE INDEX IF NOT EXISTS idx_homework_assignments_academy ON homework_assignments(academyId);
CREATE INDEX IF NOT EXISTS idx_homework_assignments_dueDate ON homework_assignments(dueDate);
CREATE INDEX IF NOT EXISTS idx_homework_assignment_targets_assignment ON homework_assignment_targets(assignmentId);
CREATE INDEX IF NOT EXISTS idx_homework_assignment_targets_student ON homework_assignment_targets(studentId);

-- 4. 기존 homework_submissions 테이블 확인 및 필요시 생성
-- (이미 존재할 수 있으므로 IF NOT EXISTS 사용)
CREATE TABLE IF NOT EXISTS homework_submissions (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  userName TEXT,
  academyId INTEGER,
  attendanceRecordId TEXT,
  score INTEGER DEFAULT 0,
  feedback TEXT,
  strengths TEXT,
  suggestions TEXT,
  subject TEXT,
  completion TEXT, -- 상, 중, 하
  effort TEXT, -- 상, 중, 하
  pageCount INTEGER DEFAULT 1,
  submittedAt TEXT NOT NULL,
  gradedAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academies(id)
);

-- 5. homework_submissions 인덱스
CREATE INDEX IF NOT EXISTS idx_homework_submissions_user ON homework_submissions(userId);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_academy ON homework_submissions(academyId);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_submitted ON homework_submissions(submittedAt);
