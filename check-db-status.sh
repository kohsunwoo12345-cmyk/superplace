#!/bin/bash

BASE_URL="https://superplacestudy.pages.dev"
SUBMISSION_ID="homework-1773308523085-ljqybbnjq"

echo "======================================"
echo "🔍 데이터베이스 상태 직접 조회"
echo "======================================"
echo ""
echo "제출 ID: $SUBMISSION_ID"
echo ""

# grading 테이블에 실제 저장되었는지 확인하기 위한 API 호출
echo "📊 채점 결과 (process-grading API로 확인)..."
curl -s -X POST "${BASE_URL}/api/homework/process-grading" \
  -H "Content-Type: application/json" \
  -d "{\"submissionId\": \"$SUBMISSION_ID\"}" | jq '.'
echo ""

echo "📝 제출 상태 (status API로 확인)..."
curl -s "${BASE_URL}/api/homework/status/${SUBMISSION_ID}" | jq '.'
echo ""
