#!/bin/bash

echo "⏳ Cloudflare Pages 배포 대기 (2분 30초)..."
sleep 150

echo ""
echo "🎯 최종 System Prompt 검증"
echo "======================================"

# Test 1: 백석중학교 봇
echo ""
echo "📝 Test 1: 백석중학교 봇 - 첫 인사"
echo "----------------------------------------"
RESPONSE1=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕",
    "botId": "bot-1773803533575-qrn2pluec",
    "userId": "final-test-001",
    "conversationHistory": []
  }')

echo "$RESPONSE1" | jq -r '.response'
echo ""

if echo "$RESPONSE1" | jq -r '.response' | grep -qi "꾸메땅학원\|단어.*암기\|스피드.*체커"; then
  echo "✅ Test 1 통과: System Prompt 정상 적용"
  TEST1_PASS=true
else
  echo "❌ Test 1 실패: System Prompt 미적용"
  TEST1_PASS=false
fi

# Test 2: 당하중학교 봇
echo ""
echo "📝 Test 2: 당하중학교 봇 - 역할 확인"
echo "----------------------------------------"
RESPONSE2=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "너는 누구야?",
    "botId": "bot-1773803031567-g9m2fa9cy",
    "userId": "final-test-002",
    "conversationHistory": []
  }')

echo "$RESPONSE2" | jq -r '.response'
echo ""

if echo "$RESPONSE2" | jq -r '.response' | grep -qi "꾸메땅학원\|단어.*암기\|스피드.*체커"; then
  echo "✅ Test 2 통과: System Prompt 정상 적용"
  TEST2_PASS=true
else
  echo "❌ Test 2 실패: System Prompt 미적용"
  TEST2_PASS=false
fi

# Test 3: 대화 히스토리 포함
echo ""
echo "📝 Test 3: 대화 히스토리 포함 - 일관성 확인"
echo "---------------------------------------------"
RESPONSE3=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "너 이름이 뭐야?",
    "botId": "bot-1773803533575-qrn2pluec",
    "userId": "final-test-003",
    "conversationHistory": [
      {"role": "user", "content": "안녕"},
      {"role": "assistant", "content": "안녕하세요!"}
    ]
  }')

echo "$RESPONSE3" | jq -r '.response'
echo ""

if echo "$RESPONSE3" | jq -r '.response' | grep -qi "꾸메땅학원\|단어.*암기\|스피드.*체커"; then
  echo "✅ Test 3 통과: 대화 히스토리 포함 시에도 System Prompt 유지"
  TEST3_PASS=true
else
  echo "❌ Test 3 실패: 일관성 문제"
  TEST3_PASS=false
fi

echo ""
echo "======================================"
echo "📊 최종 결과"
echo "======================================"

if [ "$TEST1_PASS" = true ] && [ "$TEST2_PASS" = true ] && [ "$TEST3_PASS" = true ]; then
  echo "🎉 모든 테스트 통과!"
  echo "✅ System Prompt가 모든 상황에서 정상 작동"
  echo "✅ RAG + System Prompt 통합 완벽"
else
  echo "⚠️ 일부 테스트 실패"
  echo "Test 1 (첫 인사): $TEST1_PASS"
  echo "Test 2 (역할 확인): $TEST2_PASS"
  echo "Test 3 (대화 히스토리): $TEST3_PASS"
  echo ""
  echo "추가 조사 필요: Cloudflare Logs 확인"
fi

echo ""
echo "======================================"
