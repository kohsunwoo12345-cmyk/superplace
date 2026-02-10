-- ============================================
-- 학원 관리 시스템 완전 분리 스키마
-- ============================================

-- 1. 학원(Academy) 테이블 (이미 존재하면 스킵)
CREATE TABLE IF NOT EXISTS academies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  directorId INTEGER,
  createdAt TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  FOREIGN KEY (directorId) REFERENCES users(id)
);

-- 2. 반(Class) 테이블
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  academyId INTEGER NOT NULL,
  name TEXT NOT NULL,
  grade TEXT,
  subject TEXT,
  description TEXT,
  teacherId INTEGER,
  createdAt TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  FOREIGN KEY (academyId) REFERENCES academies(id),
  FOREIGN KEY (teacherId) REFERENCES users(id)
);

-- 3. 학생-반 매핑 테이블 (한 학생이 여러 반에 속할 수 있음)
CREATE TABLE IF NOT EXISTS class_students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  classId INTEGER NOT NULL,
  studentId INTEGER NOT NULL,
  enrolledAt TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  FOREIGN KEY (classId) REFERENCES classes(id),
  FOREIGN KEY (studentId) REFERENCES users(id),
  UNIQUE(classId, studentId)
);

-- 4. 선생님 권한 테이블
CREATE TABLE IF NOT EXISTS teacher_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacherId INTEGER NOT NULL,
  academyId INTEGER NOT NULL,
  canViewAllClasses INTEGER DEFAULT 0, -- 0: 배정된 반만, 1: 전체 반
  canViewAllStudents INTEGER DEFAULT 0, -- 0: 배정된 학생만, 1: 전체 학생
  canManageHomework INTEGER DEFAULT 1, -- 숙제 관리 권한
  canManageAttendance INTEGER DEFAULT 1, -- 출석 관리 권한
  canViewStatistics INTEGER DEFAULT 0, -- 전체 통계 조회 권한
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (teacherId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academies(id),
  UNIQUE(teacherId, academyId)
);

-- 5. Users 테이블에 classId 추가 (기본 반)
ALTER TABLE users ADD COLUMN primaryClassId INTEGER;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_classes_academy ON classes(academyId);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacherId);
CREATE INDEX IF NOT EXISTS idx_class_students_class ON class_students(classId);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(studentId);
CREATE INDEX IF NOT EXISTS idx_teacher_permissions_teacher ON teacher_permissions(teacherId);
CREATE INDEX IF NOT EXISTS idx_teacher_permissions_academy ON teacher_permissions(academyId);
CREATE INDEX IF NOT EXISTS idx_users_academy ON users(academyId);
CREATE INDEX IF NOT EXISTS idx_users_primary_class ON users(primaryClassId);

-- 기존 데이터 마이그레이션을 위한 기본 학원 생성 (없는 경우만)
INSERT OR IGNORE INTO academies (id, name, code, createdAt, status)
VALUES (1, '기본 학원', 'DEFAULT001', datetime('now', '+9 hours'), 'active');

-- 기존 사용자들의 academyId가 NULL인 경우 기본 학원(1)로 설정
UPDATE users SET academyId = 1 WHERE academyId IS NULL;
