#!/bin/bash
echo "⏳ Cloudflare Pages 배포 대기 중... (2분)"
sleep 120

echo ""
echo "🧪 대화 히스토리 형식 테스트 시작..."
echo ""

# Test 1: content 형식 (기존 방식)
echo "📝 Test 1: content 형식 (기존 방식)"
RESPONSE1=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요",
    "botId": "bot-1773803533575-qrn2pluec",
    "conversationHistory": [
      {"role": "user", "content": "첫 번째 메시지"},
      {"role": "assistant", "content": "첫 번째 답변"}
    ],
    "userId": "test-user-content",
    "userRole": "STUDENT"
  }')

if echo "$RESPONSE1" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ content 형식 테스트 성공"
  echo "$RESPONSE1" | jq -r '.response' | head -c 100
  echo "..."
else
  echo "❌ content 형식 테스트 실패"
  echo "$RESPONSE1" | jq '.'
fi

echo ""
echo "---"
echo ""

# Test 2: parts 형식 (문제 발생했던 방식)
echo "📝 Test 2: parts 형식 (문제 발생했던 방식)"
RESPONSE2=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요",
    "botId": "bot-1773803533575-qrn2pluec",
    "conversationHistory": [
      {"role": "user", "parts": [{"text": "첫 번째 메시지"}]},
      {"role": "model", "parts": [{"text": "첫 번째 답변"}]}
    ],
    "userId": "test-user-parts",
    "userRole": "STUDENT"
  }')

if echo "$RESPONSE2" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ parts 형식 테스트 성공"
  echo "$RESPONSE2" | jq -r '.response' | head -c 100
  echo "..."
else
  echo "❌ parts 형식 테스트 실패"
  echo "$RESPONSE2" | jq '.'
fi

echo ""
echo "---"
echo ""

# Test 3: 혼합 형식 (content + parts)
echo "📝 Test 3: 혼합 형식 (content + parts)"
RESPONSE3=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "세 번째 메시지",
    "botId": "bot-1773803533575-qrn2pluec",
    "conversationHistory": [
      {"role": "user", "content": "첫 번째 (content)"},
      {"role": "assistant", "content": "답변 1"},
      {"role": "user", "parts": [{"text": "두 번째 (parts)"}]},
      {"role": "model", "parts": [{"text": "답변 2"}]}
    ],
    "userId": "test-user-mixed",
    "userRole": "STUDENT"
  }')

if echo "$RESPONSE3" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ 혼합 형식 테스트 성공"
  echo "$RESPONSE3" | jq -r '.response' | head -c 100
  echo "..."
else
  echo "❌ 혼합 형식 테스트 실패"
  echo "$RESPONSE3" | jq '.'
fi

echo ""
echo "=============================="
echo "✅ 모든 대화 히스토리 형식 테스트 완료"
echo "=============================="
