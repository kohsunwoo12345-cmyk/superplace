#!/bin/bash

echo "==================================="
echo "Real User 503 Error Test"
echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "==================================="
echo ""

API_URL="https://suplacestudy.com/api/ai-chat"
STUDENT_BOT_ID="bot-1773803533575-qrn2pluec"

echo "📊 Test 1: Empty conversation (학생 첫 메시지)"
RESPONSE1=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요",
    "botId": "'"$STUDENT_BOT_ID"'",
    "conversationHistory": [],
    "userId": "test-student-001",
    "sessionId": "session-001",
    "userRole": "student"
  }')
HTTP_CODE1=$(echo "$RESPONSE1" | tail -n1)
BODY1=$(echo "$RESPONSE1" | head -n-1)
echo "Status: $HTTP_CODE1"
echo "Response: $(echo "$BODY1" | jq -c '{success, error, attemptedModels, retryCount, retryAfterSeconds}')"
echo ""

echo "📊 Test 2: With conversation history (대화 중)"
RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "단어 테스트 해줘",
    "botId": "'"$STUDENT_BOT_ID"'",
    "conversationHistory": [
      {"role": "user", "parts": [{"text": "안녕하세요"}]},
      {"role": "model", "parts": [{"text": "안녕하세요! 꾸메땅학원 단어 스피드 체커입니다."}]}
    ],
    "userId": "test-student-001",
    "sessionId": "session-001",
    "userRole": "student"
  }')
HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | head -n-1)
echo "Status: $HTTP_CODE2"
echo "Response: $(echo "$BODY2" | jq -c '{success, error, attemptedModels, retryCount}')"
echo ""

echo "📊 Test 3: Rapid consecutive requests (연속 요청 시나리오)"
for i in {1..5}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
      "message": "테스트 메시지 '"$i"'",
      "botId": "'"$STUDENT_BOT_ID"'",
      "conversationHistory": [],
      "userId": "test-student-rapid",
      "sessionId": "session-rapid-'"$i"'"
    }')
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)
  SUCCESS=$(echo "$BODY" | jq -r '.success // false')
  ERROR=$(echo "$BODY" | jq -r '.error // ""')
  
  if [ "$HTTP_CODE" = "503" ] || [ "$SUCCESS" = "false" ]; then
    echo "❌ Request $i: FAILED (HTTP $HTTP_CODE) - $ERROR"
  else
    echo "✅ Request $i: SUCCESS (HTTP $HTTP_CODE)"
  fi
  sleep 0.5
done
echo ""

echo "📊 Test 4: Long conversation history (긴 대화 이력)"
LONG_HISTORY='[
  {"role": "user", "parts": [{"text": "안녕하세요"}]},
  {"role": "model", "parts": [{"text": "안녕하세요!"}]},
  {"role": "user", "parts": [{"text": "단어 테스트 해줘"}]},
  {"role": "model", "parts": [{"text": "좋습니다!"}]},
  {"role": "user", "parts": [{"text": "더 어려운 단어"}]},
  {"role": "model", "parts": [{"text": "알겠습니다"}]}
]'

RESPONSE4=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "계속해줘",
    "botId": "'"$STUDENT_BOT_ID"'",
    "conversationHistory": '"$LONG_HISTORY"',
    "userId": "test-student-001",
    "sessionId": "session-long"
  }')
HTTP_CODE4=$(echo "$RESPONSE4" | tail -n1)
BODY4=$(echo "$RESPONSE4" | head -n-1)
echo "Status: $HTTP_CODE4"
echo "Response: $(echo "$BODY4" | jq -c '{success, error, attemptedModels, retryCount}')"
echo ""

echo "==================================="
echo "✅ Real User Test Complete"
echo "==================================="
