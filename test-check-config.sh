#!/bin/bash

echo "⚙️ 채점 설정 확인..."
echo ""

TOKEN="test-token"

# 설정 조회 API 호출 (없으면 직접 process-grading 로그 확인)
echo "📋 Process-grading API 로그 확인을 위해 테스트 제출..."

PHONE="01051363624"

# 1. 숙제 제출
echo "1️⃣ 숙제 제출..."
SUBMIT_RESULT=$(curl -s -X POST "https://suplacestudy.com/api/homework-v2/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"images\": [\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\"]
  }")

echo "📊 제출 결과:"
echo "$SUBMIT_RESULT" | python3 -m json.tool

SUBMISSION_ID=$(echo "$SUBMIT_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['submission']['id'])" 2>/dev/null)

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ 제출 실패"
  exit 1
fi

echo ""
echo "✅ 제출 ID: $SUBMISSION_ID"
echo ""

# 2. 채점 대기 (3초)
echo "⏳ 채점 대기 중 (3초)..."
sleep 3

# 3. 디버그 API로 결과 확인
echo ""
echo "2️⃣ 채점 결과 확인..."
DEBUG_RESULT=$(curl -s "https://suplacestudy.com/api/homework/debug-submission?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "📊 채점 결과:"
echo "$DEBUG_RESULT" | python3 -m json.tool | head -50

echo ""
echo "✅ 설정 확인 완료"
