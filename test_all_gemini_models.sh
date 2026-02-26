#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Gemini 전체 모델 테스트 (공식 모델 포함)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_ENDPOINT="https://superplacestudy.pages.dev/api/ai/chat"

# 테스트할 모델 목록 (공식 Google Gemini API 모델)
MODELS=(
  # Gemini 2.5 Series (Premium)
  "gemini-2.5-flash"
  "gemini-2.5-pro"
  
  # Gemini 2.0 Series (Experimental)
  "gemini-2.0-flash-exp"
  "gemini-2.0-flash-thinking-exp-1219"
  
  # Gemini 1.5 Series (Stable)
  "gemini-1.5-flash"
  "gemini-1.5-flash-8b"
  "gemini-1.5-pro"
  
  # Gemini 1.0 Series (Legacy)
  "gemini-1.0-pro"
)

MODEL_LABELS=(
  "Gemini 2.5 Flash (추천)"
  "Gemini 2.5 Pro (추천)"
  "Gemini 2.0 Flash (실험)"
  "Gemini 2.0 Flash Thinking"
  "Gemini 1.5 Flash"
  "Gemini 1.5 Flash-8B"
  "Gemini 1.5 Pro"
  "Gemini 1.0 Pro (레거시)"
)

SUCCESS_COUNT=0
FAIL_COUNT=0
TOTAL=${#MODELS[@]}

for i in "${!MODELS[@]}"; do
  MODEL="${MODELS[$i]}"
  LABEL="${MODEL_LABELS[$i]}"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔍 테스트 $((i+1))/$TOTAL: $LABEL"
  echo "   모델: $MODEL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # API 호출
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"안녕하세요! 간단히 자기소개를 해주세요.\",
      \"systemPrompt\": \"당신은 친절한 AI 어시스턴트입니다.\",
      \"model\": \"$MODEL\",
      \"temperature\": 0.7,
      \"maxTokens\": 500
    }" 2>&1)
  
  # HTTP 상태 코드 추출
  HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
  BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
  
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 성공 (HTTP $HTTP_STATUS)"
    # 응답 미리보기
    echo "$BODY" | jq -r '.text' 2>/dev/null | head -c 100
    echo "..."
    echo ""
    ((SUCCESS_COUNT++))
  else
    echo "❌ 실패 (HTTP $HTTP_STATUS)"
    echo "$BODY" | jq -r '.error' 2>/dev/null || echo "$BODY"
    echo ""
    ((FAIL_COUNT++))
  fi
  
  echo ""
  sleep 1
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 테스트 결과 요약"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "총 테스트: $TOTAL"
echo "✅ 성공: $SUCCESS_COUNT ($((SUCCESS_COUNT * 100 / TOTAL))%)"
echo "❌ 실패: $FAIL_COUNT ($((FAIL_COUNT * 100 / TOTAL))%)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
