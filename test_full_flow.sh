#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "=== 1. 관리자 봇 목록 조회 ==="
BOT_RESPONSE=$(curl -s "${BASE_URL}/api/admin/ai-bots")
BOT_ID=$(echo "$BOT_RESPONSE" | jq -r '.bots[0].id')
BOT_NAME=$(echo "$BOT_RESPONSE" | jq -r '.bots[0].name')
echo "첫 번째 봇: $BOT_NAME (ID: $BOT_ID)"

echo ""
echo "=== 2. 새 세션 생성 ==="
SESSION_ID="session-test-$(date +%s)"
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/chat-sessions" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$SESSION_ID\",
    \"userId\": \"test-user-1\",
    \"academyId\": \"test-academy\",
    \"botId\": \"$BOT_ID\",
    \"title\": \"테스트 대화\",
    \"lastMessage\": \"안녕하세요!\"
  }")
echo "$CREATE_RESPONSE" | jq '.'

echo ""
echo "=== 3. 메시지 저장 ==="
MESSAGE_ID="msg-$(date +%s)"
MSG_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/chat-messages" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$MESSAGE_ID\",
    \"sessionId\": \"$SESSION_ID\",
    \"userId\": \"test-user-1\",
    \"role\": \"user\",
    \"content\": \"안녕하세요! 이것은 테스트 메시지입니다.\"
  }")
echo "$MSG_RESPONSE" | jq '.'

echo ""
echo "=== 4. 세션 목록 조회 ==="
SESSIONS=$(curl -s "${BASE_URL}/api/chat-sessions?userId=test-user-1")
echo "$SESSIONS" | jq '.'

echo ""
echo "=== 5. 메시지 조회 ==="
MESSAGES=$(curl -s "${BASE_URL}/api/chat-messages?sessionId=$SESSION_ID&userId=test-user-1")
echo "$MESSAGES" | jq '.'

echo ""
echo "✅ 전체 테스트 완료!"
