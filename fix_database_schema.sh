#!/bin/bash
set -e

echo "🔧 데이터베이스 스키마 수정"
echo "===================================="

ACCOUNT_ID="117379ce5c9d9af026b16c9cf21b10d5"
DB_ID="8c106540-21b4-4fa9-8879-c4956e459ca1"
DB_NAME="webapp-production"

echo ""
echo "1️⃣  기존 테이블 백업..."
npx wrangler d1 execute "$DB_NAME" --command "CREATE TABLE IF NOT EXISTS homework_gradings_v2_backup_20260314 AS SELECT * FROM homework_gradings_v2"
npx wrangler d1 execute "$DB_NAME" --command "CREATE TABLE IF NOT EXISTS homework_submissions_v2_backup_20260314 AS SELECT * FROM homework_submissions_v2"

echo ""
echo "2️⃣  기존 테이블 삭제..."
npx wrangler d1 execute "$DB_NAME" --command "DROP TABLE IF EXISTS homework_gradings_v2"
npx wrangler d1 execute "$DB_NAME" --command "DROP TABLE IF EXISTS homework_submissions_v2"

echo ""
echo "3️⃣  새 테이블 생성 (userId TEXT)..."
npx wrangler d1 execute "$DB_NAME" --command "
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
)"

npx wrangler d1 execute "$DB_NAME" --command "
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
)"

echo ""
echo "✅ 스키마 수정 완료!"
echo ""
echo "📝 주의사항:"
echo "   - 기존 데이터는 *_backup_20260314 테이블에 저장되었습니다"
echo "   - 필요시 수동으로 데이터 마이그레이션 가능"
echo "   - 새 제출부터 정상 동작합니다"
