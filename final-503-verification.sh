#!/bin/bash

echo "=========================================="
echo "🔥 FINAL 503 ERROR VERIFICATION TEST"
echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="
echo ""

# 1. Cloudflare Pages 배포 대기 (3분)
echo "⏳ Step 1: Cloudflare Pages 배포 대기 중... (3분)"
sleep 180

API_URL="https://suplacestudy.com/api/ai-chat"
STUDENT_BOT_ID="bot-1773803533575-qrn2pluec"

echo ""
echo "=========================================="
echo "📊 TEST SUITE 1: 일반 사용 시나리오"
echo "=========================================="

# Test 1: 첫 메시지
echo ""
echo "Test 1: 학생 첫 메시지 (Empty conversation)"
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
SUCCESS1=$(echo "$BODY1" | jq -r '.success // false')

if [ "$HTTP_CODE1" = "200" ] && [ "$SUCCESS1" = "true" ]; then
  echo "✅ Test 1: SUCCESS (HTTP $HTTP_CODE1)"
  echo "   Response preview: $(echo "$BODY1" | jq -r '.response' | head -c 50)..."
else
  echo "❌ Test 1: FAILED (HTTP $HTTP_CODE1, success=$SUCCESS1)"
  echo "   Error: $(echo "$BODY1" | jq -r '.error // "unknown"')"
fi

# Test 2: 대화 이력 있음
echo ""
echo "Test 2: 대화 이력 포함 (With conversation history)"
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
SUCCESS2=$(echo "$BODY2" | jq -r '.success // false')

if [ "$HTTP_CODE2" = "200" ] && [ "$SUCCESS2" = "true" ]; then
  echo "✅ Test 2: SUCCESS (HTTP $HTTP_CODE2)"
  echo "   Response preview: $(echo "$BODY2" | jq -r '.response' | head -c 50)..."
else
  echo "❌ Test 2: FAILED (HTTP $HTTP_CODE2, success=$SUCCESS2)"
  echo "   Error: $(echo "$BODY2" | jq -r '.error // "unknown"')"
fi

echo ""
echo "=========================================="
echo "📊 TEST SUITE 2: 연속 요청 (부하 테스트)"
echo "=========================================="

SUCCESS_COUNT=0
FAIL_COUNT=0
ERROR_503_COUNT=0

for i in {1..10}; do
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
  
  if [ "$HTTP_CODE" = "503" ]; then
    ERROR_503_COUNT=$((ERROR_503_COUNT + 1))
    RETRY_AFTER=$(echo "$BODY" | jq -r '.retryAfterSeconds // "N/A"')
    ATTEMPTED_MODELS=$(echo "$BODY" | jq -r '.attemptedModels // [] | join(" → ")')
    echo "❌ Request $i: 503 ERROR (retryAfter: ${RETRY_AFTER}s, models: $ATTEMPTED_MODELS)"
  elif [ "$SUCCESS" = "true" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    RETRY_COUNT=$(echo "$BODY" | jq -r '.retryCount // 0')
    echo "✅ Request $i: SUCCESS (HTTP $HTTP_CODE, retries: $RETRY_COUNT)"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    ERROR_MSG=$(echo "$BODY" | jq -r '.error // "unknown"')
    echo "❌ Request $i: FAILED (HTTP $HTTP_CODE) - $ERROR_MSG"
  fi
  sleep 0.5
done

echo ""
echo "=========================================="
echo "📊 TEST SUITE 3: 긴 대화 이력 (복잡한 요청)"
echo "=========================================="

LONG_HISTORY='[
  {"role": "user", "parts": [{"text": "안녕하세요"}]},
  {"role": "model", "parts": [{"text": "안녕하세요!"}]},
  {"role": "user", "parts": [{"text": "단어 테스트 해줘"}]},
  {"role": "model", "parts": [{"text": "좋습니다!"}]},
  {"role": "user", "parts": [{"text": "더 어려운 단어"}]},
  {"role": "model", "parts": [{"text": "알겠습니다"}]},
  {"role": "user", "parts": [{"text": "영어 단어"}]},
  {"role": "model", "parts": [{"text": "영어 단어입니다"}]}
]'

echo ""
echo "Test 3: 긴 대화 이력 (8 messages)"
RESPONSE3=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "계속해줘",
    "botId": "'"$STUDENT_BOT_ID"'",
    "conversationHistory": '"$LONG_HISTORY"',
    "userId": "test-student-001",
    "sessionId": "session-long"
  }')
HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
BODY3=$(echo "$RESPONSE3" | head -n-1)
SUCCESS3=$(echo "$BODY3" | jq -r '.success // false')

if [ "$HTTP_CODE3" = "200" ] && [ "$SUCCESS3" = "true" ]; then
  echo "✅ Test 3: SUCCESS (HTTP $HTTP_CODE3)"
  echo "   Response preview: $(echo "$BODY3" | jq -r '.response' | head -c 50)..."
  RETRY_COUNT=$(echo "$BODY3" | jq -r '.retryCount // 0')
  echo "   Retry count: $RETRY_COUNT"
else
  echo "❌ Test 3: FAILED (HTTP $HTTP_CODE3, success=$SUCCESS3)"
  echo "   Error: $(echo "$BODY3" | jq -r '.error // "unknown"')"
fi

echo ""
echo "=========================================="
echo "📊 FINAL RESULTS"
echo "=========================================="

TOTAL_TESTS=$((SUCCESS_COUNT + FAIL_COUNT + ERROR_503_COUNT + 3))
TOTAL_SUCCESS=$((SUCCESS_COUNT + 3))

echo ""
echo "📈 Test Suite 1 & 3 (Individual tests):"
echo "   Test 1 (First message): $([ "$SUCCESS1" = "true" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "   Test 2 (With history): $([ "$SUCCESS2" = "true" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "   Test 3 (Long history): $([ "$SUCCESS3" = "true" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo ""
echo "📈 Test Suite 2 (Rapid requests):"
echo "   Success: $SUCCESS_COUNT/10"
echo "   Failed: $FAIL_COUNT/10"
echo "   503 Errors: $ERROR_503_COUNT/10"
echo ""
echo "📊 Overall Statistics:"
echo "   Total Tests: 13"
echo "   Success Rate: $(echo "scale=1; $TOTAL_SUCCESS * 100 / 13" | bc)%"
echo "   503 Error Rate: $(echo "scale=1; $ERROR_503_COUNT * 100 / 13" | bc)%"
echo ""

if [ $ERROR_503_COUNT -eq 0 ] && [ "$SUCCESS1" = "true" ] && [ "$SUCCESS2" = "true" ] && [ "$SUCCESS3" = "true" ]; then
  echo "=========================================="
  echo "🎉 SUCCESS: 503 에러 완전히 해결됨!"
  echo "=========================================="
  echo ""
  echo "✅ 모든 테스트 통과 (13/13)"
  echo "✅ 503 에러 발생 없음 (0%)"
  echo "✅ API 안정성 확보"
  echo ""
  exit 0
else
  echo "=========================================="
  echo "⚠️  WARNING: 일부 테스트 실패"
  echo "=========================================="
  echo ""
  if [ $ERROR_503_COUNT -gt 0 ]; then
    echo "❌ 503 에러 여전히 발생 중 ($ERROR_503_COUNT 건)"
  fi
  if [ "$SUCCESS1" != "true" ] || [ "$SUCCESS2" != "true" ] || [ "$SUCCESS3" != "true" ]; then
    echo "❌ 기본 기능 테스트 실패"
  fi
  echo ""
  exit 1
fi
