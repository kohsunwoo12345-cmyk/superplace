#!/bin/bash

echo "=== process-grading API 직접 테스트 ==="
echo ""

# First submit homework
SUBMIT_URL="https://superplacestudy.pages.dev/api/homework/submit"
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "1. 숙제 제출"
RESPONSE=$(curl -s -X POST "$SUBMIT_URL" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": 1, \"images\": [\"$TEST_IMAGE\"]}")

echo "$RESPONSE" | jq '.'
SUBMISSION_ID=$(echo "$RESPONSE" | jq -r '.submission.id')

if [ -z "$SUBMISSION_ID" ]; then
  echo "제출 실패"
  exit 1
fi

echo ""
echo "2. Submission ID: $SUBMISSION_ID"
echo ""

# Manually trigger process-grading
echo "3. process-grading API 직접 호출"
PROCESS_URL="https://superplacestudy.pages.dev/api/homework/process-grading"

START_TIME=$(date +%s)
PROCESS_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROCESS_URL" \
  -H "Content-Type: application/json" \
  -d "{\"submissionId\": \"$SUBMISSION_ID\"}")

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

HTTP_CODE=$(echo "$PROCESS_RESPONSE" | tail -n1)
BODY=$(echo "$PROCESS_RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "처리 시간: ${DURATION}초"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Check status after
echo "4. 채점 후 상태 확인"
sleep 2
STATUS_URL="https://superplacestudy.pages.dev/api/homework/status/$SUBMISSION_ID"
STATUS_RESPONSE=$(curl -s "$STATUS_URL")
echo "$STATUS_RESPONSE" | jq '.'

GRADING_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
if [ "$GRADING_STATUS" = "graded" ]; then
  echo ""
  echo "✅ 수동 채점 성공!"
  echo "📊 점수: $(echo "$STATUS_RESPONSE" | jq -r '.grading.score')"
else
  echo ""
  echo "❌ 채점 실패: status=$GRADING_STATUS"
fi

