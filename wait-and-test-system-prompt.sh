#!/bin/bash

echo "⏳ Cloudflare Pages 배포 완료 대기 중... (2분)"
sleep 120

echo ""
echo "🧪 System Prompt 전달 테스트 시작"
echo "=================================="

# 테스트 1: 역할 확인
echo ""
echo "📝 Test 1: 봇 역할 확인"
RESPONSE=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요, 당신은 누구인가요?",
    "botId": "bot-1773803533575-qrn2pluec",
    "userId": "test-'$(date +%s)'",
    "conversationHistory": []
  }')

echo "Response:"
echo "$RESPONSE" | jq '.'

echo ""
echo "AI 답변:"
echo "$RESPONSE" | jq -r '.response' | head -c 200
echo ""

# 응답 분석
if echo "$RESPONSE" | grep -qi "꾸메땅학원\|단어.*암기\|스피드.*체커"; then
  echo "✅ System Prompt 정상 전달됨!"
else
  echo "❌ System Prompt가 여전히 무시되고 있습니다"
  echo ""
  echo "🔍 상세 응답:"
  echo "$RESPONSE" | jq -r '.response'
fi

echo ""
echo "=================================="
echo "✅ 테스트 완료"
