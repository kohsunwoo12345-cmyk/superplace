-- ===================================================================
-- Homework 테이블 스키마 수정 스크립트
-- 실행 방법: Cloudflare Dashboard → D1 → webapp-production → Console
-- ===================================================================

-- 1. 기존 데이터 백업
CREATE TABLE IF NOT EXISTS homework_gradings_v2_backup_20260314 AS 
SELECT * FROM homework_gradings_v2;

CREATE TABLE IF NOT EXISTS homework_submissions_v2_backup_20260314 AS 
SELECT * FROM homework_submissions_v2;

-- 2. 기존 테이블 삭제
DROP TABLE IF EXISTS homework_gradings_v2;
DROP TABLE IF EXISTS homework_submissions_v2;

-- 3. 새 테이블 생성 (userId를 TEXT로 변경)
CREATE TABLE homework_submissions_v2 (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  code TEXT,
  imageUrl TEXT,
  submittedAt TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'submitted',
  academyId INTEGER,
  gradingResult TEXT,
  gradedAt TEXT
);

CREATE TABLE homework_gradings_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submissionId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT,
  userEmail TEXT,
  academyId INTEGER,
  totalQuestions INTEGER,
  correctAnswers INTEGER,
  score INTEGER,
  subject TEXT,
  detailedResults TEXT,
  overallFeedback TEXT,
  strengths TEXT,
  improvements TEXT,
  weaknessTypes TEXT,
  conceptsNeeded TEXT,
  commonMistakes TEXT,
  studyDirection TEXT,
  problemAnalysis TEXT,
  completionLevel TEXT,
  effortLevel TEXT,
  gradedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- 완료! 이제 새 숙제 제출부터 정상 동작합니다.
