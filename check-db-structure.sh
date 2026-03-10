#!/bin/bash

echo "=== DB 구조 확인 ==="
echo ""

# Test submission to see what's stored
SUBMIT_URL="https://superplacestudy.pages.dev/api/homework/submit"
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "1. 테스트 제출"
RESPONSE=$(curl -s -X POST "$SUBMIT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "images": ["'"$TEST_IMAGE"'"]
  }')

echo "$RESPONSE" | jq '.'
SUBMISSION_ID=$(echo "$RESPONSE" | jq -r '.submission.id')

if [ -z "$SUBMISSION_ID" ]; then
  echo "제출 실패"
  exit 1
fi

echo ""
echo "2. 제출 ID: $SUBMISSION_ID"
echo ""

# Wait a bit
echo "3. 5초 대기..."
sleep 5
echo ""

# Try to check status with more detailed error handling
echo "4. 상태 확인 (상세 에러 출력)"
STATUS_URL="https://superplacestudy.pages.dev/api/homework/status/$SUBMISSION_ID"

curl -v "$STATUS_URL" 2>&1 | head -n 50

