#!/bin/bash
set -e

echo "🔧 원격 데이터베이스 스키마 수정"
echo "====================================="

DB_NAME="webapp-production"

echo ""
echo "1️⃣  기존 테이블 백업..."
npx wrangler d1 execute "$DB_NAME" --remote --command "CREATE TABLE IF NOT EXISTS homework_gradings_v2_backup_20260314 AS SELECT * FROM homework_gradings_v2"
npx wrangler d1 execute "$DB_NAME" --remote --command "CREATE TABLE IF NOT EXISTS homework_submissions_v2_backup_20260314 AS SELECT * FROM homework_submissions_v2"

echo ""
echo "2️⃣  기존 테이블 삭제..."
npx wrangler d1 execute "$DB_NAME" --remote --command "DROP TABLE IF EXISTS homework_gradings_v2"
npx wrangler d1 execute "$DB_NAME" --remote --command "DROP TABLE IF EXISTS homework_submissions_v2"

echo ""
echo "3️⃣  새 테이블 생성 (userId TEXT)..."
npx wrangler d1 execute "$DB_NAME" --remote --command "CREATE TABLE homework_submissions_v2 (id TEXT PRIMARY KEY, userId TEXT NOT NULL, code TEXT, imageUrl TEXT, submittedAt TEXT DEFAULT (datetime('now')), status TEXT DEFAULT 'submitted', academyId INTEGER, gradingResult TEXT, gradedAt TEXT)"

npx wrangler d1 execute "$DB_NAME" --remote --command "CREATE TABLE homework_gradings_v2 (id INTEGER PRIMARY KEY AUTOINCREMENT, submissionId TEXT NOT NULL, userId TEXT NOT NULL, userName TEXT, userEmail TEXT, academyId INTEGER, totalQuestions INTEGER, correctAnswers INTEGER, score INTEGER, subject TEXT, detailedResults TEXT, overallFeedback TEXT, strengths TEXT, improvements TEXT, weaknessTypes TEXT, conceptsNeeded TEXT, commonMistakes TEXT, studyDirection TEXT, problemAnalysis TEXT, completionLevel TEXT, effortLevel TEXT, gradedAt TEXT, createdAt TEXT DEFAULT (datetime('now')))"

echo ""
echo "✅ 원격 스키마 수정 완료!"
