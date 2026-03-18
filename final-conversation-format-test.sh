#!/bin/bash
echo "🧪 최종 대화 히스토리 형식 테스트"
echo "=================================="
echo ""

# Test 1: content 형식
echo "📝 Test 1: content 형식 (기존)"
R1=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "나는 누구인가요?",
    "botId": "bot-1773803533575-qrn2pluec",
    "conversationHistory": [
      {"role": "user", "content": "안녕하세요"},
      {"role": "assistant", "content": "안녕하세요!"}
    ],
    "userId": "test1",
    "userRole": "STUDENT"
  }')

if echo "$R1" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Success"
  echo "$R1" | jq -r '.response' | head -c 150
  echo ""
else
  echo "❌ Failed"
  echo "$R1" | jq '.error'
fi

echo ""
echo "---"
echo ""

# Test 2: parts 형식
echo "📝 Test 2: parts 형식 (Gemini 표준)"
R2=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "당신은 누구인가요?",
    "botId": "bot-1773803533575-qrn2pluec",
    "conversationHistory": [
      {"role": "user", "parts": [{"text": "안녕하세요"}]},
      {"role": "model", "parts": [{"text": "안녕하세요! 꾸메땅학원입니다."}]}
    ],
    "userId": "test2",
    "userRole": "STUDENT"
  }')

if echo "$R2" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Success"
  echo "$R2" | jq -r '.response' | head -c 150
  echo ""
else
  echo "❌ Failed"
  echo "$R2" | jq '.error'
fi

echo ""
echo "---"
echo ""

# Test 3: 혼합 형식
echo "📝 Test 3: 혼합 형식 (content + parts)"
R3=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "내 역할은?",
    "botId": "bot-1773803533575-qrn2pluec",
    "conversationHistory": [
      {"role": "user", "content": "첫 메시지"},
      {"role": "assistant", "content": "첫 답변"},
      {"role": "user", "parts": [{"text": "두 번째"}]},
      {"role": "model", "parts": [{"text": "두 번째 답변"}]}
    ],
    "userId": "test3",
    "userRole": "STUDENT"
  }')

if echo "$R3" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Success"
  echo "$R3" | jq -r '.response' | head -c 150
  echo ""
else
  echo "❌ Failed"
  echo "$R3" | jq '.error'
fi

echo ""
echo "=================================="
echo "✅ 대화 히스토리 형식 테스트 완료"
echo "=================================="
