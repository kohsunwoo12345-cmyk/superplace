#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Google Gemini API 사용 가능 모델 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Google AI Studio에서 공식적으로 지원하는 모델들 테스트
MODELS=(
  "gemini-2.5-flash-latest:v1beta"
  "gemini-2.5-pro-latest:v1beta"
  "gemini-2.0-flash-exp:v1beta"
  "gemini-1.5-flash:v1beta"
  "gemini-1.5-flash-latest:v1beta"
  "gemini-1.5-flash-002:v1beta"
  "gemini-1.5-flash-8b:v1beta"
  "gemini-1.5-flash-8b-latest:v1beta"
  "gemini-1.5-pro:v1beta"
  "gemini-1.5-pro-latest:v1beta"
  "gemini-1.5-pro-002:v1beta"
  "gemini-1.0-pro:v1"
  "gemini-1.0-pro-latest:v1"
  "gemini-pro:v1"
)

API_URL="https://superplacestudy.pages.dev/api/ai/chat"
SUCCESS=0
TOTAL=0

echo "테스트 중인 모델 수: ${#MODELS[@]}"
echo ""

for MODEL_INFO in "${MODELS[@]}"; do
  TOTAL=$((TOTAL + 1))
  MODEL="${MODEL_INFO%%:*}"
  
  echo "[$TOTAL/${#MODELS[@]}] 테스트: $MODEL"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 10 -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"hi\", \"model\": \"$MODEL\", \"maxTokens\": 50}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ 작동"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "   ❌ 실패 (HTTP $HTTP_CODE)"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "결과: $SUCCESS/$TOTAL 모델 작동"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
