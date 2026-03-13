#!/bin/bash

echo "🔍 채점 실패 원인 진단"
echo "======================================"

# 1. 최근 failed 제출 확인
echo ""
echo "1️⃣ 최근 failed 제출 찾기..."
curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer 1|admin@superplace.co.kr|ADMIN|$(date +%s)000" | \
  jq '[.results[] | select(.status == "failed")] | .[0:3] | .[] | {id: .submissionId, status: .status, submitted: .submittedAt}'

echo ""
echo "2️⃣ 제출 & 채점 테스트..."

# 출석 확인
USER_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d '{"code": "402246"}')

USER_ID=$(echo "$USER_RESPONSE" | jq -r '.student.id')

if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
    echo "❌ 사용자 정보 없음"
    exit 1
fi

echo "✅ 사용자: $USER_ID"

# 매우 작은 테스트 이미지 (10x10 PNG, 약 200 bytes)
TINY_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC"

echo ""
echo "📤 제출 중..."
SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"code\": \"402246\",
    \"images\": [\"$TINY_IMAGE\"]
  }")

echo "$SUBMIT_RESPONSE" | jq '.'

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id')

if [ -z "$SUBMISSION_ID" ] || [ "$SUBMISSION_ID" = "null" ]; then
    echo "❌ 제출 실패"
    exit 1
fi

echo ""
echo "✅ 제출 ID: $SUBMISSION_ID"
echo "⏳ 40초 대기 (채점 완료 예상)..."
sleep 40

echo ""
echo "3️⃣ 채점 결과 확인..."
RESULT=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer 1|admin@superplace.co.kr|ADMIN|$(date +%s)000" | \
  jq --arg id "$SUBMISSION_ID" '.results[] | select(.submissionId == $id)')

if [ -z "$RESULT" ]; then
    echo "❌ 결과를 찾을 수 없음"
else
    echo "$RESULT" | jq '{
      id: .submissionId,
      status: .status,
      score: .grading.score,
      gradingId: .grading.id,
      subject: .grading.subject,
      hasGrading: (.grading != null)
    }'
fi

