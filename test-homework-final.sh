#!/bin/bash

echo "=== 숙제 자동 채점 최종 테스트 ==="
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Test submission endpoint
SUBMIT_URL="https://superplacestudy.pages.dev/api/homework/submit"

# Create a test image (simple base64)
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "1️⃣  숙제 제출 (자동 채점 트리거)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
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
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Extract submissionId from nested structure
SUBMISSION_ID=$(echo "$BODY" | jq -r '.submission.id // empty' 2>/dev/null)

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ 제출 실패 - submissionId를 찾을 수 없음"
  exit 1
fi

echo "✅ 제출 성공: $SUBMISSION_ID"
echo ""

# Wait for background grading
echo "2️⃣  백그라운드 채점 대기"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for i in {15..1}; do
  printf "\r⏱  남은 시간: %2d초" $i
  sleep 1
done
echo ""
echo ""
  
# Check grading status with correct URL format
echo "3️⃣  채점 결과 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
STATUS_URL="https://superplacestudy.pages.dev/api/homework/status/$SUBMISSION_ID"

echo "Checking: $STATUS_URL"
echo ""

STATUS_RESPONSE=$(curl -s -w "\n%{http_code}" "$STATUS_URL")
STATUS_HTTP_CODE=$(echo "$STATUS_RESPONSE" | tail -n1)
STATUS_BODY=$(echo "$STATUS_RESPONSE" | head -n-1)

echo "HTTP Status: $STATUS_HTTP_CODE"
echo "Response:"
echo "$STATUS_BODY" | jq '.' 2>/dev/null || echo "$STATUS_BODY"
echo ""

# Parse status
GRADING_STATUS=$(echo "$STATUS_BODY" | jq -r '.status // empty' 2>/dev/null)
HAS_GRADING=$(echo "$STATUS_BODY" | jq -r '.grading // empty' 2>/dev/null)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$GRADING_STATUS" = "graded" ] && [ -n "$HAS_GRADING" ] && [ "$HAS_GRADING" != "null" ]; then
  echo "🎉 자동 채점 성공!"
  echo ""
  SCORE=$(echo "$STATUS_BODY" | jq -r '.grading.score // "N/A"')
  SUBJECT=$(echo "$STATUS_BODY" | jq -r '.grading.subject // "N/A"')
  FEEDBACK=$(echo "$STATUS_BODY" | jq -r '.grading.feedback // "N/A"' | head -c 150)
  echo "📊 채점 점수: $SCORE"
  echo "📚 과목: $SUBJECT"
  echo "💬 피드백: $FEEDBACK..."
  echo ""
  echo "✅ 백그라운드 자동 채점이 정상 작동합니다!"
elif [ "$GRADING_STATUS" = "pending" ]; then
  echo "⏳ 아직 채점 중 (pending)..."
  echo ""
  echo "4️⃣  추가 대기 (20초) 후 재확인"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  for i in {20..1}; do
    printf "\r⏱  남은 시간: %2d초" $i
    sleep 1
  done
  echo ""
  echo ""
  
  # Second check
  STATUS_RESPONSE2=$(curl -s "$STATUS_URL")
  echo "재확인 결과:"
  echo "$STATUS_RESPONSE2" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE2"
  echo ""
  
  GRADING_STATUS2=$(echo "$STATUS_RESPONSE2" | jq -r '.status // empty' 2>/dev/null)
  if [ "$GRADING_STATUS2" = "graded" ]; then
    echo "✅ 자동 채점 성공! (지연 후 완료)"
  else
    echo "❌ 채점이 완료되지 않음"
    echo "현재 상태: $GRADING_STATUS2"
    echo ""
    echo "⚠️  백그라운드 채점 프로세스 확인 필요"
  fi
else
  echo "❌ 채점 실패 또는 결과 없음"
  echo "상태: $GRADING_STATUS"
  echo "채점 데이터: $HAS_GRADING"
  echo ""
  echo "⚠️  process-grading.ts 로직 확인 필요"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "=== 테스트 완료 ==="
