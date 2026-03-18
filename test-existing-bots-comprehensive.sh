#!/bin/bash

echo "========================================="
echo "기존 봇 RAG 테스트 (Comprehensive)"
echo "========================================="
echo ""

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
PAGES_API_URL="https://suplacestudy.com/api/ai-chat"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

# 테스트할 봇 목록
BOTS=(
  "bot-1773803533575-qrn2pluec:백석중학교 3학년"
  "bot-1773803031567-g9m2fa9cy:당하중학교 3학년"
  "bot-1773747096787-ji4yl4sud:고3 수능"
)

echo "📋 테스트 시나리오:"
echo "1. Worker RAG 엔드포인트 직접 호출 (context 검색 확인)"
echo "2. Pages API 호출 (전체 플로우 확인)"
echo ""

for BOT_ENTRY in "${BOTS[@]}"; do
  IFS=':' read -r BOT_ID BOT_NAME <<< "$BOT_ENTRY"
  
  echo "========================================="
  echo "🤖 봇: $BOT_NAME"
  echo "ID: $BOT_ID"
  echo "========================================="
  
  # Test 1: Worker RAG 직접 호출
  echo ""
  echo "Test 1: Worker RAG 직접 호출"
  echo "---"
  
  WORKER_RESPONSE=$(curl -s -X POST "$WORKER_URL/chat" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d "{
      \"message\": \"안녕하세요, 첫 번째 단어를 알려주세요\",
      \"botId\": \"$BOT_ID\",
      \"userId\": \"test-user-001\",
      \"enableRAG\": true,
      \"topK\": 5,
      \"systemPrompt\": \"You are a helpful AI assistant.\",
      \"conversationHistory\": []
    }")
  
  echo "Worker Response:"
  echo "$WORKER_RESPONSE" | jq -r '
    if .ragEnabled then
      "✅ RAG Enabled: \(.ragEnabled)"
    else
      "❌ RAG Enabled: \(.ragEnabled // "undefined")"
    end,
    "Context Count: \(.ragContextCount // 0)",
    if (.ragContext | length) > 0 then
      "Sample Context: \(.ragContext[0].text[:100])..."
    else
      "No context retrieved"
    end
  '
  
  echo ""
  
  # Test 2: Pages API 호출
  echo "Test 2: Pages API 전체 플로우"
  echo "---"
  
  PAGES_RESPONSE=$(curl -s -X POST "$PAGES_API_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"첫 번째 단어를 알려주세요\",
      \"botId\": \"$BOT_ID\",
      \"userId\": \"test-user-001\",
      \"conversationHistory\": []
    }")
  
  echo "Pages Response:"
  echo "$PAGES_RESPONSE" | jq -r '
    if .success then
      "✅ Success: true"
    else
      "❌ Success: false"
    end,
    "Response length: \(.response | length // 0) chars",
    "Worker RAG Used: \(.workerRAGUsed // false)",
    "RAG Context Count: \(.ragContextCount // 0)",
    if .response then
      "Response preview: \(.response[:150])..."
    else
      "Error: \(.message // "No response")"
    end
  '
  
  echo ""
  echo "========================================="
  echo ""
  
  sleep 2
done

echo ""
echo "✅ 전체 테스트 완료"
echo ""
echo "📊 요약:"
echo "1. Worker RAG가 context를 검색하면 → Vectorize 작동 중"
echo "2. Pages API가 Worker RAG Used: true를 반환하면 → 전체 플로우 정상"
echo "3. Pages API 응답이 길고 정확하면 → 봇이 knowledgeBase 활용 중"
