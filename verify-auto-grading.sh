#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     숙제 자동 채점 시스템 최종 검증                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

SUBMIT_URL="https://superplacestudy.pages.dev/api/homework/submit"
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "1️⃣  숙제 제출"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

START=$(date +%s)
SUBMIT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$SUBMIT_URL" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": 1, \"images\": [\"$TEST_IMAGE\"]}")

END=$(date +%s)
HTTP_CODE=$(echo "$SUBMIT_RESPONSE" | tail -n1)
BODY=$(echo "$SUBMIT_RESPONSE" | head -n-1)
SUBMIT_TIME=$((END - START))

echo "HTTP Status: $HTTP_CODE"
echo "응답 시간: ${SUBMIT_TIME}초"
echo ""
echo "$BODY" | jq '.'

SUBMISSION_ID=$(echo "$BODY" | jq -r '.submission.id // empty')

if [ -z "$SUBMISSION_ID" ]; then
  echo ""
  echo "❌ 제출 실패"
  exit 1
fi

echo ""
echo "✅ 제출 성공: $SUBMISSION_ID"
echo ""

echo "2️⃣  백그라운드 채점 대기"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STATUS_URL="https://superplacestudy.pages.dev/api/homework/status/$SUBMISSION_ID"

echo "15초 대기 중..."
for i in {15..1}; do
  printf "\r⏱  %2d초 남음" $i
  sleep 1
done
echo ""
echo ""

echo "3️⃣  채점 결과 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STATUS_RESPONSE=$(curl -s "$STATUS_URL")
echo "$STATUS_RESPONSE" | jq '.'

GRADING_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status // empty')
HAS_GRADING=$(echo "$STATUS_RESPONSE" | jq -r '.grading // empty')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$GRADING_STATUS" = "graded" ] && [ -n "$HAS_GRADING" ] && [ "$HAS_GRADING" != "null" ]; then
  SCORE=$(echo "$STATUS_RESPONSE" | jq -r '.grading.score // "N/A"')
  SUBJECT=$(echo "$STATUS_RESPONSE" | jq -r '.grading.subject // "N/A"')
  FEEDBACK=$(echo "$STATUS_RESPONSE" | jq -r '.grading.feedback // "N/A"' | head -c 100)
  
  echo "🎉🎉🎉 자동 채점 성공! 🎉🎉🎉"
  echo ""
  echo "📊 점수: $SCORE점"
  echo "📚 과목: $SUBJECT"
  echo "💬 피드백: ${FEEDBACK}..."
  echo ""
  echo "✅ 백그라운드 자동 채점이 정상 작동합니다!"
  
elif [ "$GRADING_STATUS" = "pending" ]; then
  echo "⏳ 아직 채점 중입니다..."
  echo ""
  echo "4️⃣  추가 20초 대기 후 재확인"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  for i in {20..1}; do
    printf "\r⏱  %2d초 남음" $i
    sleep 1
  done
  echo ""
  echo ""
  
  STATUS_RESPONSE2=$(curl -s "$STATUS_URL")
  echo "$STATUS_RESPONSE2" | jq '.'
  
  GRADING_STATUS2=$(echo "$STATUS_RESPONSE2" | jq -r '.status // empty')
  HAS_GRADING2=$(echo "$STATUS_RESPONSE2" | jq -r '.grading // empty')
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if [ "$GRADING_STATUS2" = "graded" ] && [ -n "$HAS_GRADING2" ] && [ "$HAS_GRADING2" != "null" ]; then
    SCORE=$(echo "$STATUS_RESPONSE2" | jq -r '.grading.score // "N/A"')
    SUBJECT=$(echo "$STATUS_RESPONSE2" | jq -r '.grading.subject // "N/A"')
    
    echo "🎉 자동 채점 완료! (지연)"
    echo ""
    echo "📊 점수: $SCORE점"
    echo "📚 과목: $SUBJECT"
    echo ""
    echo "✅ 백그라운드 자동 채점이 정상 작동합니다!"
  else
    echo "❌ 채점이 완료되지 않았습니다."
    echo "현재 상태: $GRADING_STATUS2"
    echo ""
    echo "🔍 수동 채점 트리거 테스트..."
    
    MANUAL_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/process-grading" \
      -H "Content-Type: application/json" \
      -d "{\"submissionId\": \"$SUBMISSION_ID\"}")
    
    echo "$MANUAL_RESPONSE" | jq '.'
  fi
else
  echo "❌ 채점 실패"
  echo "상태: $GRADING_STATUS"
  echo ""
  echo "🔍 수동 채점 트리거 테스트..."
  
  MANUAL_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/process-grading" \
    -H "Content-Type: application/json" \
    -d "{\"submissionId\": \"$SUBMISSION_ID\"}")
  
  echo "$MANUAL_RESPONSE" | jq '.'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "=== 검증 완료 ==="

