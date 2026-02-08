-- 숙제 과제 테이블 (선생님이 학생에게 부여하는 숙제)
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

-- 숙제 과제 대상 학생 테이블 (특정 학생에게만 부여할 때)
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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_homework_assignments_teacher ON homework_assignments(teacherId);
CREATE INDEX IF NOT EXISTS idx_homework_assignments_academy ON homework_assignments(academyId);
CREATE INDEX IF NOT EXISTS idx_homework_assignments_dueDate ON homework_assignments(dueDate);
CREATE INDEX IF NOT EXISTS idx_homework_assignment_targets_assignment ON homework_assignment_targets(assignmentId);
CREATE INDEX IF NOT EXISTS idx_homework_assignment_targets_student ON homework_assignment_targets(studentId);
