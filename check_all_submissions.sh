#!/bin/bash

echo "=== 데이터베이스에서 직접 조회 (전체 제출 데이터) ==="
npx wrangler d1 execute webapp-production --remote --command \
"SELECT 
  COUNT(*) as total_count,
  COUNT(CASE WHEN status='graded' THEN 1 END) as graded_count,
  COUNT(CASE WHEN gradingResult IS NOT NULL THEN 1 END) as has_result_count,
  MIN(submittedAt) as first_submission,
  MAX(submittedAt) as latest_submission
FROM homework_submissions_v2;" 2>&1 | grep -v "wrangler" | grep -v "^$"

echo ""
echo "=== 최근 10개 제출 데이터 샘플 ==="
npx wrangler d1 execute webapp-production --remote --command \
"SELECT 
  id,
  userId,
  status,
  CASE WHEN gradingResult IS NULL THEN '❌ NULL' ELSE '✅ EXISTS' END as result_status,
  submittedAt
FROM homework_submissions_v2 
ORDER BY submittedAt DESC 
LIMIT 10;" 2>&1 | grep -v "wrangler" | grep -v "^$"

echo ""
echo "=== homework_gradings_v2 테이블 데이터 확인 ==="
npx wrangler d1 execute webapp-production --remote --command \
"SELECT COUNT(*) as grading_table_count FROM homework_gradings_v2;" 2>&1 | grep -v "wrangler" | grep -v "^$"

