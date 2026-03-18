#!/bin/bash

echo "========================================="
echo "System Prompt 디버그 테스트"
echo "========================================="
echo ""

PAGES_API_URL="https://suplacestudy.com/api/ai-chat"
BOT_ID="bot-1773803533575-qrn2pluec"

# 간단한 테스트 - 봇 역할 확인
echo "🧪 Test: 봇이 자신의 역할을 설명하는지 확인"
echo ""

curl -s -X POST "$PAGES_API_URL" \
  -H "Content-Type: application/json" \
  -H "Cache-Control: no-cache" \
  -H "Pragma: no-cache" \
  -d "{
    \"message\": \"안녕하세요! 저를 테스트해주세요. 당신은 누구인가요?\",
    \"botId\": \"$BOT_ID\",
    \"userId\": \"debug-test-$(date +%s)\",
    \"conversationHistory\": []
  }" | jq '.'

echo ""
echo "========================================="
echo ""
echo "📋 기대하는 응답:"
echo "   '저는 꾸메땅학원의 중등부 전용 단어 암기 스피드 체커입니다'"
echo ""
echo "만약 '저는 Google 언어 모델입니다'라고 답하면"
echo "   → System Prompt가 전달되지 않은 것입니다"
echo ""
