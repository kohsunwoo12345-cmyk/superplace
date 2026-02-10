-- ============================================
-- 반 스케줄 및 색상 추가 스키마
-- ============================================

-- 1. classes 테이블에 color 필드 추가
ALTER TABLE classes ADD COLUMN color TEXT DEFAULT '#3B82F6';

-- 2. 수업 스케줄 테이블 생성
CREATE TABLE IF NOT EXISTS class_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  classId INTEGER NOT NULL,
  dayOfWeek INTEGER NOT NULL, -- 0=일요일, 1=월요일, ..., 6=토요일
  startTime TEXT NOT NULL,    -- 'HH:MM' 형식
  endTime TEXT NOT NULL,      -- 'HH:MM' 형식
  subject TEXT,               -- 과목명 (선택)
  room TEXT,                  -- 교실명 (선택)
  createdAt TEXT NOT NULL,
  FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_class_schedules_class ON class_schedules(classId);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day ON class_schedules(dayOfWeek);
