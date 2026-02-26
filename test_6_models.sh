#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Gemini 6개 모델 API 호출 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_URL="https://superplacestudy.pages.dev/api/ai/chat"

# 테스트할 6개 모델
declare -a MODELS=(
  "gemini-2.5-flash:Gemini 2.5 Flash (추천)"
  "gemini-2.5-pro:Gemini 2.5 Pro (추천)"
  "gemini-2.0-flash:Gemini 2.0 Flash"
  "gemini-2.0-pro:Gemini 2.0 Pro"
  "gemini-1.5-flash:Gemini 1.5 Flash"
  "gemini-1.5-pro:Gemini 1.5 Pro"
)

SUCCESS=0
FAILED=0
TOTAL=0

for MODEL_PAIR in "${MODELS[@]}"; do
  TOTAL=$((TOTAL + 1))
  MODEL="${MODEL_PAIR%%:*}"
  LABEL="${MODEL_PAIR##*:}"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔍 테스트 $TOTAL/6: $LABEL"
  echo "   모델명: $MODEL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    --max-time 15 \
    -d "{
      \"message\": \"Hello! Please respond in Korean and tell me your model name.\",
      \"systemPrompt\": \"당신은 친절한 AI 어시스턴트입니다.\",
      \"model\": \"$MODEL\",
      \"temperature\": 0.7,
      \"maxTokens\": 300,
      \"topK\": 40,
      \"topP\": 0.95
    }")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    RESPONSE_TEXT=$(echo "$BODY" | jq -r '.response' 2>/dev/null)
    if [ ! -z "$RESPONSE_TEXT" ] && [ "$RESPONSE_TEXT" != "null" ]; then
      echo "✅ 성공! (HTTP $HTTP_CODE)"
      echo "📥 응답 미리보기:"
      echo "$RESPONSE_TEXT" | head -c 150
      echo "..."
      SUCCESS=$((SUCCESS + 1))
    else
      echo "⚠️  응답이 비어있음 (HTTP $HTTP_CODE)"
      echo "$BODY"
      FAILED=$((FAILED + 1))
    fi
  else
    echo "❌ 실패! (HTTP $HTTP_CODE)"
    ERROR_MSG=$(echo "$BODY" | jq -r '.error // .message // "알 수 없는 오류"' 2>/dev/null)
    ERROR_DETAILS=$(echo "$BODY" | jq -r '.details' 2>/dev/null | head -c 200)
    echo "📥 오류: $ERROR_MSG"
    if [ ! -z "$ERROR_DETAILS" ] && [ "$ERROR_DETAILS" != "null" ]; then
      echo "📝 상세: ${ERROR_DETAILS}..."
    fi
    FAILED=$((FAILED + 1))
  fi
  
  echo ""
  sleep 1
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 최종 결과"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   전체: $TOTAL 개"
echo "   ✅ 성공: $SUCCESS 개 ($(( SUCCESS * 100 / TOTAL ))%)"
echo "   ❌ 실패: $FAILED 개 ($(( FAILED * 100 / TOTAL ))%)"
echo ""

if [ $SUCCESS -eq $TOTAL ]; then
  echo "🎉 모든 모델이 정상 작동합니다!"
elif [ $SUCCESS -gt 0 ]; then
  echo "⚠️  $SUCCESS/$TOTAL 모델만 작동합니다."
else
  echo "❗ 모든 모델이 실패했습니다."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
