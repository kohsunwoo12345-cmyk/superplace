#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Gemini 모델 API 호출 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="https://superplacestudy.pages.dev"
API_ENDPOINT="${BASE_URL}/api/ai/chat"

# 사용자가 요청한 모델들 + 기본 모델들
MODELS=(
  "gemini-2.5-flash:Gemini 2.5 Flash"
  "gemini-2.5-pro:Gemini 2.5 Pro"
  "gemini-exp-1206:Gemini 3.1 Pro"
  "gemini-3-flash:Gemini 3 Flash"
  "gemini-3-pro:Gemini 3 Pro"
  "gemini-2.0-flash-exp:Gemini 2.0 Flash (기본)"
  "gemini-1.5-flash:Gemini 1.5 Flash"
)

echo "📍 테스트 대상 URL: ${API_ENDPOINT}"
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for MODEL_PAIR in "${MODELS[@]}"; do
  MODEL_NAME="${MODEL_PAIR%%:*}"
  MODEL_LABEL="${MODEL_PAIR##*:}"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔍 테스트 중: ${MODEL_LABEL}"
  echo "   모델명: ${MODEL_NAME}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"안녕하세요! 간단히 자기소개를 해주세요.\",
      \"systemPrompt\": \"당신은 친절한 AI 어시스턴트입니다.\",
      \"model\": \"${MODEL_NAME}\",
      \"temperature\": 0.7,
      \"maxTokens\": 300,
      \"topK\": 40,
      \"topP\": 0.95
    }")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ 성공! (HTTP ${HTTP_CODE})"
    RESPONSE_TEXT=$(echo "$BODY" | jq -r '.response' 2>/dev/null)
    if [ ! -z "$RESPONSE_TEXT" ] && [ "$RESPONSE_TEXT" != "null" ]; then
      echo "📥 응답 미리보기:"
      echo "$RESPONSE_TEXT" | head -c 150
      echo "..."
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
      echo "⚠️  응답이 비어있음"
      echo "$BODY"
    fi
  else
    echo "❌ 실패! (HTTP ${HTTP_CODE})"
    echo "📥 오류 응답:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  
  echo ""
  sleep 0.5
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 테스트 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 결과 요약:"
echo "   ✅ 성공: ${SUCCESS_COUNT}개"
echo "   ❌ 실패: ${FAIL_COUNT}개"
echo ""
