#!/bin/bash

echo "🔍 상세 API 테스트"
echo "=================================="

# Test 1: 대화 히스토리 없음 (기본)
echo ""
echo "📝 Test 1: 대화 히스토리 없음"
echo "-----------------------------------"
RESPONSE1=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요",
    "botId": "bot-1773803533575-qrn2pluec",
    "userId": "debug-001",
    "conversationHistory": []
  }')

echo "Success: $(echo "$RESPONSE1" | jq -r '.success')"
echo "RAG Used: $(echo "$RESPONSE1" | jq -r '.workerRAGUsed')"
echo "Context Count: $(echo "$RESPONSE1" | jq -r '.ragContextCount')"
echo "Response Preview:"
echo "$RESPONSE1" | jq -r '.response' | head -c 200
echo ""

# Test 2: 대화 히스토리 포함 (Gemini 형식)
echo ""
echo "📝 Test 2: 대화 히스토리 포함 (Gemini 형식)"
echo "-----------------------------------"
RESPONSE2=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "너는 누구야?",
    "botId": "bot-1773803533575-qrn2pluec",
    "userId": "debug-002",
    "conversationHistory": [
      {"role": "user", "content": "안녕"},
      {"role": "assistant", "content": "안녕하세요!"}
    ]
  }')

echo "Full Response:"
echo "$RESPONSE2" | jq '.'
echo ""

if echo "$RESPONSE2" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Test 2 성공"
  echo "Response: $(echo "$RESPONSE2" | jq -r '.response' | head -c 200)"
else
  echo "❌ Test 2 실패"
  echo "Error: $(echo "$RESPONSE2" | jq -r '.error // .message')"
fi

# Test 3: 다른 봇으로 테스트
echo ""
echo "📝 Test 3: 다른 봇 테스트 (당하중학교 3학년)"
echo "-----------------------------------"
RESPONSE3=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요, 당신은 누구인가요?",
    "botId": "bot-1773803031567-g9m2fa9cy",
    "userId": "debug-003",
    "conversationHistory": []
  }')

echo "Success: $(echo "$RESPONSE3" | jq -r '.success')"
echo "Response:"
echo "$RESPONSE3" | jq -r '.response' | head -c 200
echo ""

echo "=================================="
