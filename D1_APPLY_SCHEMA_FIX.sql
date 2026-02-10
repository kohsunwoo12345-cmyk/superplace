-- ============================================
-- D1 데이터베이스 스키마 수정 SQL
-- ============================================
-- Cloudflare D1 콘솔에서 실행하세요
-- 이 SQL은 기존 데이터를 보존하면서 스키마를 수정합니다

-- 1. classes 테이블에 color 컬럼이 없으면 추가
-- (이미 있으면 에러 발생하지만 무시 가능)
ALTER TABLE classes ADD COLUMN color TEXT DEFAULT '#3B82F6';

-- 2. class_schedules 테이블 생성 (없으면)
CREATE TABLE IF NOT EXISTS class_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  classId INTEGER NOT NULL,
  dayOfWeek INTEGER NOT NULL,
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  subject TEXT,
  room TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_class_schedules_class ON class_schedules(classId);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day ON class_schedules(dayOfWeek);

-- 4. 확인용 쿼리 (실행 후 결과 확인)
SELECT '=== classes 테이블 구조 확인 ===' as info;
PRAGMA table_info(classes);

SELECT '=== class_schedules 테이블 구조 확인 ===' as info;
PRAGMA table_info(class_schedules);

SELECT '=== class_students 테이블 구조 확인 ===' as info;
PRAGMA table_info(class_students);

-- 5. 샘플 데이터 확인
SELECT '=== 현재 classes 데이터 ===' as info;
SELECT id, name, academyId, teacherId, status FROM classes LIMIT 5;

SELECT '=== 현재 users (STUDENT) 데이터 ===' as info;
SELECT id, email, name, role, academyId FROM users WHERE role='STUDENT' LIMIT 5;
