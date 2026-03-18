#!/bin/bash

echo "🔍 500 에러 원인 파악"
echo "===================================="

echo ""
echo "1️⃣ 실제 API 호출로 500 에러 재현"
echo "-----------------------------------"

# 학생 계정 시뮬레이션
STUDENT_ID="test-student-500"
ACADEMY_ID="academy-test-001"
BOT_ID="bot-1773803533575-qrn2pluec"

echo "테스트 파라미터:"
echo "- Student ID: $STUDENT_ID"
echo "- Academy ID: $ACADEMY_ID"
echo "- Bot ID: $BOT_ID"
echo ""

# AI 챗 API 호출
echo "💬 AI 챗 API 호출 중..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요",
    "botId": "'"$BOT_ID"'",
    "userId": "'"$STUDENT_ID"'",
    "conversationHistory": [],
    "userRole": "STUDENT",
    "userAcademyId": "'"$ACADEMY_ID"'"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP Status Code: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "500" ]; then
  echo ""
  echo "❌ 500 에러 발생!"
  echo ""
  echo "에러 메시지:"
  echo "$BODY" | jq -r '.error // .message // .' 2>/dev/null
fi

echo ""
echo "===================================="
