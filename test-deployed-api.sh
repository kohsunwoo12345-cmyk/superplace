#!/bin/bash

echo "🧪 배포된 Gemini API 테스트"
echo "=============================="
echo ""

# 테스트 페이로드
PAYLOAD='{
  "message": "안녕하세요",
  "botId": "test-bot-id",
  "sessionId": "test-session-id",
  "model": "gemini-2.5-flash-lite",
  "systemPrompt": "당신은 친절한 AI 어시스턴트입니다.",
  "temperature": 1,
  "maxTokens": 4096,
  "topK": 64,
  "topP": 0.95
}'

echo "📤 요청 URL: https://suplacestudy.com/api/ai-chat"
echo "📤 요청 Body:"
echo "$PAYLOAD" | jq '.'
echo ""

# API 호출
echo "📡 API 호출 중..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://suplacestudy.com/api/ai-chat" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# 응답 분리
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo "📡 HTTP 상태 코드: $HTTP_CODE"
echo "📡 응답 Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "✅ 테스트 성공!"
else
  echo ""
  echo "❌ 테스트 실패 (HTTP $HTTP_CODE)"
fi

