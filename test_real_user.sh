#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "=== 1. 실제 관리자 계정으로 세션 조회 (userId=1) ==="
curl -s "${BASE_URL}/api/chat-sessions?userId=1" | jq '.'

echo ""
echo "=== 2. 다른 userId로 테스트 ==="
curl -s "${BASE_URL}/api/chat-sessions?userId=admin" | jq '.'

echo ""
echo "=== 3. 테스트 세션 생성 및 조회 ==="
TEST_SESSION="session-$(date +%s)"
echo "세션 ID: $TEST_SESSION"

# 봇 ID 가져오기
BOT_ID=$(curl -s "${BASE_URL}/api/admin/ai-bots" | jq -r '.bots[0].id')
echo "봇 ID: $BOT_ID"

# 세션 생성
curl -s -X POST "${BASE_URL}/api/chat-sessions" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$TEST_SESSION\",
    \"userId\": \"1\",
    \"academyId\": \"superplace-academy\",
    \"botId\": \"$BOT_ID\",
    \"title\": \"실제 테스트 대화\",
    \"lastMessage\": \"안녕하세요!\"
  }" | jq '.'

echo ""
echo "=== 4. 생성 후 세션 목록 재조회 ==="
curl -s "${BASE_URL}/api/chat-sessions?userId=1" | jq '.'

