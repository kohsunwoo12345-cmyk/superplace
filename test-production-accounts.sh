#!/bin/bash
echo "🔍 프로덕션 API 테스트 (실제 사용자 시뮬레이션)"
echo ""

# 테스트할 봇 ID (실제 존재하는 봇)
BOT_ID="bot-1773803533575-qrn2pluec"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 1: 학생 계정 시뮬레이션 (첫 메시지)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE1=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"안녕하세요\",
    \"botId\": \"$BOT_ID\",
    \"conversationHistory\": [],
    \"userId\": \"student-test-$(date +%s)\",
    \"userRole\": \"STUDENT\",
    \"userAcademyId\": \"academy-test-001\"
  }")

HTTP_STATUS1=$(echo "$RESPONSE1" | grep "HTTP_STATUS:" | cut -d':' -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $HTTP_STATUS1"
if [ "$HTTP_STATUS1" == "200" ]; then
  echo "✅ 성공"
  echo "$BODY1" | jq '{success, workerRAGUsed, ragContextCount, responsePreview: (.response[:100])}' 2>/dev/null || echo "$BODY1"
else
  echo "❌ 실패"
  echo "$BODY1" | jq '.' 2>/dev/null || echo "$BODY1"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 2: 학생 계정 시뮬레이션 (대화 히스토리 포함)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"당신은 누구인가요?\",
    \"botId\": \"$BOT_ID\",
    \"conversationHistory\": [
      {\"role\": \"user\", \"content\": \"안녕하세요\"},
      {\"role\": \"assistant\", \"content\": \"안녕하세요! 저는 꾸메땅학원의 중등부 전용 단어 암기 스피드 체커입니다.\"}
    ],
    \"userId\": \"student-test-$(date +%s)\",
    \"userRole\": \"STUDENT\",
    \"userAcademyId\": \"academy-test-001\"
  }")

HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS:" | cut -d':' -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $HTTP_STATUS2"
if [ "$HTTP_STATUS2" == "200" ]; then
  echo "✅ 성공"
  echo "$BODY2" | jq '{success, workerRAGUsed, ragContextCount, responsePreview: (.response[:100])}' 2>/dev/null || echo "$BODY2"
else
  echo "❌ 실패"
  echo "$BODY2" | jq '.' 2>/dev/null || echo "$BODY2"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 3: 학원장 계정 시뮬레이션 (첫 메시지)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE3=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"안녕하세요\",
    \"botId\": \"$BOT_ID\",
    \"conversationHistory\": [],
    \"userId\": \"owner-test-$(date +%s)\",
    \"userRole\": \"OWNER\",
    \"userAcademyId\": \"academy-test-001\"
  }")

HTTP_STATUS3=$(echo "$RESPONSE3" | grep "HTTP_STATUS:" | cut -d':' -f2)
BODY3=$(echo "$RESPONSE3" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $HTTP_STATUS3"
if [ "$HTTP_STATUS3" == "200" ]; then
  echo "✅ 성공"
  echo "$BODY3" | jq '{success, workerRAGUsed, ragContextCount, responsePreview: (.response[:100])}' 2>/dev/null || echo "$BODY3"
else
  echo "❌ 실패"
  echo "$BODY3" | jq '.' 2>/dev/null || echo "$BODY3"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 4: 학원장 계정 시뮬레이션 (대화 히스토리 포함)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE4=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"세 번째 메시지입니다\",
    \"botId\": \"$BOT_ID\",
    \"conversationHistory\": [
      {\"role\": \"user\", \"content\": \"첫 번째 메시지\"},
      {\"role\": \"assistant\", \"content\": \"첫 번째 답변\"},
      {\"role\": \"user\", \"content\": \"두 번째 메시지\"},
      {\"role\": \"assistant\", \"content\": \"두 번째 답변\"}
    ],
    \"userId\": \"owner-test-$(date +%s)\",
    \"userRole\": \"OWNER\",
    \"userAcademyId\": \"academy-test-001\"
  }")

HTTP_STATUS4=$(echo "$RESPONSE4" | grep "HTTP_STATUS:" | cut -d':' -f2)
BODY4=$(echo "$RESPONSE4" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $HTTP_STATUS4"
if [ "$HTTP_STATUS4" == "200" ]; then
  echo "✅ 성공"
  echo "$BODY4" | jq '{success, workerRAGUsed, ragContextCount, responsePreview: (.response[:100])}' 2>/dev/null || echo "$BODY4"
else
  echo "❌ 실패"
  echo "$BODY4" | jq '.' 2>/dev/null || echo "$BODY4"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 테스트 요약"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SUCCESS_COUNT=0
FAIL_COUNT=0

[ "$HTTP_STATUS1" == "200" ] && SUCCESS_COUNT=$((SUCCESS_COUNT+1)) || FAIL_COUNT=$((FAIL_COUNT+1))
[ "$HTTP_STATUS2" == "200" ] && SUCCESS_COUNT=$((SUCCESS_COUNT+1)) || FAIL_COUNT=$((FAIL_COUNT+1))
[ "$HTTP_STATUS3" == "200" ] && SUCCESS_COUNT=$((SUCCESS_COUNT+1)) || FAIL_COUNT=$((FAIL_COUNT+1))
[ "$HTTP_STATUS4" == "200" ] && SUCCESS_COUNT=$((SUCCESS_COUNT+1)) || FAIL_COUNT=$((FAIL_COUNT+1))

echo "✅ 성공: $SUCCESS_COUNT/4"
echo "❌ 실패: $FAIL_COUNT/4"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "⚠️ 일부 테스트가 실패했습니다."
  echo ""
  echo "실패한 테스트:"
  [ "$HTTP_STATUS1" != "200" ] && echo "- Test 1: 학생 첫 메시지 (Status: $HTTP_STATUS1)"
  [ "$HTTP_STATUS2" != "200" ] && echo "- Test 2: 학생 대화 히스토리 (Status: $HTTP_STATUS2)"
  [ "$HTTP_STATUS3" != "200" ] && echo "- Test 3: 학원장 첫 메시지 (Status: $HTTP_STATUS3)"
  [ "$HTTP_STATUS4" != "200" ] && echo "- Test 4: 학원장 대화 히스토리 (Status: $HTTP_STATUS4)"
else
  echo "🎉 모든 테스트 성공!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
