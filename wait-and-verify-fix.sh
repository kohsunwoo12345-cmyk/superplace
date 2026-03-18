#!/bin/bash

echo "⏳ Cloudflare Pages 배포 대기 (2분)..."
sleep 120

echo ""
echo "🧪 System Prompt 강화 검증"
echo "===================================="

# Test 1: 첫 메시지 (이전에 문제였던 케이스)
echo ""
echo "📝 Test 1: 첫 메시지 - System Prompt 적용 확인"
echo "-------------------------------------------"
RESPONSE1=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요",
    "botId": "bot-1773803533575-qrn2pluec",
    "userId": "verify-001",
    "conversationHistory": []
  }')

echo "Success: $(echo "$RESPONSE1" | jq -r '.success')"
echo "RAG Used: $(echo "$RESPONSE1" | jq -r '.workerRAGUsed')"
echo "Context Count: $(echo "$RESPONSE1" | jq -r '.ragContextCount')"
echo ""
echo "AI 답변:"
AI_RESPONSE=$(echo "$RESPONSE1" | jq -r '.response')
echo "$AI_RESPONSE"
echo ""

# 검증
if echo "$AI_RESPONSE" | grep -qi "꾸메땅학원\|단어.*암기\|스피드.*체커"; then
  echo "✅ System Prompt 정상 적용됨! (첫 메시지에서도 역할 소개)"
else
  echo "⚠️ System Prompt 여전히 약함 - 추가 조치 필요"
fi

# Test 2: 다른 봇으로 검증
echo ""
echo "📝 Test 2: 다른 봇 (당하중학교) - 일관성 확인"
echo "-------------------------------------------"
RESPONSE2=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕",
    "botId": "bot-1773803031567-g9m2fa9cy",
    "userId": "verify-002",
    "conversationHistory": []
  }')

AI_RESPONSE2=$(echo "$RESPONSE2" | jq -r '.response')
echo "AI 답변:"
echo "$AI_RESPONSE2"
echo ""

if echo "$AI_RESPONSE2" | grep -qi "꾸메땅학원\|단어.*암기\|스피드.*체커"; then
  echo "✅ 다른 봇도 System Prompt 정상 적용"
else
  echo "⚠️ 일관성 문제 - 추가 확인 필요"
fi

echo ""
echo "===================================="
echo "📊 최종 검증 완료"
echo "===================================="
