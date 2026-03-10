#!/bin/bash

echo "=== 숙제 자동 채점 테스트 ==="
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Test submission endpoint
SUBMIT_URL="https://superplacestudy.pages.dev/api/homework/submit"
PROCESS_URL="https://superplacestudy.pages.dev/api/homework/process-grading"

# Create a test image (simple base64)
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "1. 숙제 제출 테스트 (자동 채점 트리거)"
START_TIME=$(date +%s%3N)

SUBMIT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$SUBMIT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "images": ["'"$TEST_IMAGE"'"],
    "assignmentId": 1
  }')

END_TIME=$(date +%s%3N)
HTTP_CODE=$(echo "$SUBMIT_RESPONSE" | tail -n1)
BODY=$(echo "$SUBMIT_RESPONSE" | head -n-1)
DURATION=$((END_TIME - START_TIME))

echo "HTTP Status: $HTTP_CODE"
echo "Response Time: ${DURATION}ms"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Extract submissionId
SUBMISSION_ID=$(echo "$BODY" | jq -r '.submissionId // empty' 2>/dev/null)

if [ -n "$SUBMISSION_ID" ]; then
  echo "✓ 제출 성공: submissionId=$SUBMISSION_ID"
  echo ""
  
  # Wait for background grading
  echo "2. 백그라운드 채점 대기 (10초)..."
  for i in {10..1}; do
    echo -n "$i... "
    sleep 1
  done
  echo ""
  echo ""
  
  # Check grading status
  echo "3. 채점 결과 확인"
  STATUS_URL="https://superplacestudy.pages.dev/api/homework/status?submissionId=$SUBMISSION_ID"
  
  STATUS_RESPONSE=$(curl -s -w "\n%{http_code}" "$STATUS_URL")
  STATUS_HTTP_CODE=$(echo "$STATUS_RESPONSE" | tail -n1)
  STATUS_BODY=$(echo "$STATUS_RESPONSE" | head -n-1)
  
  echo "HTTP Status: $STATUS_HTTP_CODE"
  echo "Status Response:"
  echo "$STATUS_BODY" | jq '.' 2>/dev/null || echo "$STATUS_BODY"
  echo ""
  
  # Parse status
  GRADING_STATUS=$(echo "$STATUS_BODY" | jq -r '.status // empty' 2>/dev/null)
  HAS_GRADING=$(echo "$STATUS_BODY" | jq -r '.grading // empty' 2>/dev/null)
  
  if [ "$GRADING_STATUS" = "graded" ] && [ -n "$HAS_GRADING" ]; then
    echo "✓✓✓ 자동 채점 성공!"
    echo "채점 점수: $(echo "$STATUS_BODY" | jq -r '.grading.score // "N/A"')"
    echo "피드백: $(echo "$STATUS_BODY" | jq -r '.grading.feedback // "N/A"' | head -c 100)..."
  elif [ "$GRADING_STATUS" = "pending" ]; then
    echo "⚠ 아직 채점 중 (pending)..."
    echo "추가 대기 후 다시 확인 필요"
  else
    echo "✗ 채점 실패 또는 결과 없음"
    echo "Status: $GRADING_STATUS"
  fi
else
  echo "✗ 제출 실패"
fi

echo ""
echo "=== 테스트 완료 ==="
