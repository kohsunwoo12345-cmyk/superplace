#!/bin/bash

echo "🧪 다양한 시나리오 500 에러 테스트"
echo "===================================="

BOT_ID="bot-1773803533575-qrn2pluec"

test_api() {
  local test_name="$1"
  local request_body="$2"
  
  echo ""
  echo "📝 $test_name"
  echo "-----------------------------------"
  
  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST https://suplacestudy.com/api/ai-chat \
    -H "Content-Type: application/json" \
    -d "$request_body")
  
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
  BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')
  
  echo "Status: $HTTP_CODE"
  
  if [ "$HTTP_CODE" = "500" ]; then
    echo "❌ 500 에러 발생!"
    echo "$BODY" | jq '.'
  elif [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 성공"
    echo "응답: $(echo "$BODY" | jq -r '.response' | head -c 100)..."
  else
    echo "⚠️ 예상치 못한 상태 코드"
    echo "$BODY" | jq '.'
  fi
}

# Test 1: 기본 요청
test_api "Test 1: 기본 요청" '{
  "message": "안녕",
  "botId": "'"$BOT_ID"'",
  "userId": "test-001",
  "conversationHistory": []
}'

# Test 2: conversationHistory가 null
test_api "Test 2: conversationHistory가 null" '{
  "message": "안녕",
  "botId": "'"$BOT_ID"'",
  "userId": "test-002",
  "conversationHistory": null
}'

# Test 3: conversationHistory 미포함
test_api "Test 3: conversationHistory 미포함" '{
  "message": "안녕",
  "botId": "'"$BOT_ID"'",
  "userId": "test-003"
}'

# Test 4: 대화 히스토리 포함 (올바른 형식)
test_api "Test 4: 대화 히스토리 포함 (role + content)" '{
  "message": "Spanish 뜻은?",
  "botId": "'"$BOT_ID"'",
  "userId": "test-004",
  "conversationHistory": [
    {"role": "user", "content": "안녕"},
    {"role": "assistant", "content": "안녕하세요"}
  ]
}'

# Test 5: 대화 히스토리 (잘못된 형식 - parts 형식)
test_api "Test 5: 대화 히스토리 (parts 형식)" '{
  "message": "Spanish 뜻은?",
  "botId": "'"$BOT_ID"'",
  "userId": "test-005",
  "conversationHistory": [
    {"role": "user", "parts": [{"text": "안녕"}]},
    {"role": "model", "parts": [{"text": "안녕하세요"}]}
  ]
}'

# Test 6: 긴 대화 히스토리
LONG_HISTORY='[
  {"role": "user", "content": "안녕"},
  {"role": "assistant", "content": "안녕하세요"},
  {"role": "user", "content": "너는 누구야?"},
  {"role": "assistant", "content": "저는 AI입니다"},
  {"role": "user", "content": "Spanish 뜻은?"},
  {"role": "assistant", "content": "스페인의"},
  {"role": "user", "content": "try 뜻은?"},
  {"role": "assistant", "content": "시도하다"}
]'

test_api "Test 6: 긴 대화 히스토리 (8개)" '{
  "message": "marathon 뜻은?",
  "botId": "'"$BOT_ID"'",
  "userId": "test-006",
  "conversationHistory": '"$LONG_HISTORY"'
}'

# Test 7: 특수문자 포함
test_api "Test 7: 특수문자 포함 메시지" '{
  "message": "Hello! 안녕하세요? <test> \"quote\" '\''single'\''",
  "botId": "'"$BOT_ID"'",
  "userId": "test-007",
  "conversationHistory": []
}'

# Test 8: 빈 메시지
test_api "Test 8: 빈 메시지" '{
  "message": "",
  "botId": "'"$BOT_ID"'",
  "userId": "test-008",
  "conversationHistory": []
}'

# Test 9: botId 없음
test_api "Test 9: botId 없음" '{
  "message": "안녕",
  "userId": "test-009",
  "conversationHistory": []
}'

# Test 10: 존재하지 않는 botId
test_api "Test 10: 존재하지 않는 botId" '{
  "message": "안녕",
  "botId": "bot-nonexistent-12345",
  "userId": "test-010",
  "conversationHistory": []
}'

echo ""
echo "===================================="
echo "📊 테스트 완료"
echo "===================================="
