#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Gemini 모델 API 호출 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="https://superplacestudy.pages.dev"
API_ENDPOINT="${BASE_URL}/api/ai/chat"

# 테스트할 모델 목록
MODELS=(
  "gemini-2.0-flash-exp"
  "gemini-2.5-flash"
  "gemini-2.5-pro"
  "gemini-exp-1206"
  "gemini-1.5-flash-latest"
  "gemini-1.5-pro-latest"
)

echo "📍 테스트 대상 URL: ${API_ENDPOINT}"
echo ""

for MODEL in "${MODELS[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔍 테스트 중: ${MODEL}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"안녕하세요! 간단히 자기소개 해주세요.\",
      \"systemPrompt\": \"당신은 친절한 AI 어시스턴트입니다.\",
      \"model\": \"${MODEL}\",
      \"temperature\": 0.7,
      \"maxTokens\": 500,
      \"topK\": 40,
      \"topP\": 0.95
    }")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ 성공! (HTTP ${HTTP_CODE})"
    echo "📥 응답:"
    echo "$BODY" | jq -r '.response' 2>/dev/null || echo "$BODY"
  else
    echo "❌ 실패! (HTTP ${HTTP_CODE})"
    echo "📥 오류 응답:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  fi
  
  echo ""
  sleep 1
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 테스트 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
