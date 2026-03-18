#!/bin/bash

echo "========================================="
echo "System Prompt 전달 테스트"
echo "========================================="
echo ""

PAGES_API_URL="https://suplacestudy.com/api/ai-chat"
BOT_ID="bot-1773803533575-qrn2pluec"

echo "🤖 테스트 봇: 백석중학교 3학년 단어 암기"
echo "   이 봇의 System Prompt:"
echo "   '너는 꾸메땅학원의 중등부 전용 단어 암기 스피드 체커야.'"
echo ""
echo "========================================="
echo "Test 1: 봇 역할 확인 (프롬프트 준수 테스트)"
echo "========================================="

RESPONSE1=$(curl -s -X POST "$PAGES_API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"너는 누구니? 네 역할이 뭐야?\",
    \"botId\": \"$BOT_ID\",
    \"userId\": \"test-system-prompt-001\",
    \"conversationHistory\": []
  }")

echo "📊 Response:"
echo "$RESPONSE1" | jq -r '
  "✅ Success: \(.success)",
  "📊 Worker RAG Used: \(.workerRAGUsed)",
  "📊 RAG Context Count: \(.ragContextCount)",
  "",
  "💬 AI Response:",
  .response
'

echo ""
echo ""
echo "========================================="
echo "Test 2: 단어 질문 (지식 베이스 활용 테스트)"
echo "========================================="

RESPONSE2=$(curl -s -X POST "$PAGES_API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Spanish 단어의 뜻을 알려주고, 단어 스피드 체커로서 나를 테스트해줘\",
    \"botId\": \"$BOT_ID\",
    \"userId\": \"test-system-prompt-001\",
    \"conversationHistory\": []
  }")

echo "📊 Response:"
echo "$RESPONSE2" | jq -r '
  "✅ Success: \(.success)",
  "📊 Worker RAG Used: \(.workerRAGUsed)",
  "📊 RAG Context Count: \(.ragContextCount)",
  "",
  "💬 AI Response:",
  .response
'

echo ""
echo ""
echo "========================================="
echo "✅ 테스트 완료"
echo "========================================="
echo ""
echo "분석:"
echo "1. Test 1에서 봇이 자신의 역할을 '단어 암기 스피드 체커'로 소개하면 ✅"
echo "2. Test 2에서 봇이 단어를 가르치고 테스트하는 톤을 사용하면 ✅"
echo "3. 둘 다 통과하면 System Prompt가 정상 작동하는 것입니다."
