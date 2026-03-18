#!/bin/bash

echo "========================================="
echo "전체 봇 RAG 작동 검증"
echo "========================================="
echo ""

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
PAGES_API_URL="https://suplacestudy.com/api/ai-chat"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

# 테스트할 봇 목록
BOTS=(
  "bot-1773803533575-qrn2pluec:백석중학교 3학년:Spanish"
  "bot-1773803031567-g9m2fa9cy:당하중학교 3학년:surfing"
  "bot-1773747096787-ji4yl4sud:고3 수능:outdoors"
  "bot-1773650118731-bvi048whp:마전중학교 2학년:marathon"
  "bot-1773649764706-z00uhj0lt:당하중학교 2학년:because"
)

for BOT_ENTRY in "${BOTS[@]}"; do
  IFS=':' read -r BOT_ID BOT_NAME TEST_WORD <<< "$BOT_ENTRY"
  
  echo "========================================="
  echo "🤖 $BOT_NAME"
  echo "   ID: $BOT_ID"
  echo "   Test word: $TEST_WORD"
  echo "========================================="
  
  # Test via Pages API
  RESPONSE=$(curl -s -X POST "$PAGES_API_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"${TEST_WORD}의 뜻을 알려주세요\",
      \"botId\": \"$BOT_ID\",
      \"userId\": \"verify-test-001\",
      \"conversationHistory\": []
    }")
  
  echo "$RESPONSE" | jq -r '
    if .success then
      "✅ Success: true"
    else
      "❌ Success: false"
    end,
    "📊 Worker RAG Used: \(.workerRAGUsed // false)",
    "📊 RAG Context Count: \(.ragContextCount // 0)",
    "",
    if .response and (.response | length) > 50 then
      "💬 AI Response (preview):",
      (.response | .[0:200]) + "..."
    else
      "⚠️ Response: \(.response // .message // "No response")"
    end
  '
  
  echo ""
  sleep 2
done

echo ""
echo "========================================="
echo "✅ 전체 검증 완료"
echo "========================================="
