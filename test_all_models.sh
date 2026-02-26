#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 전체 Gemini 모델 API 호출 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_URL="https://superplacestudy.pages.dev/api/ai/chat"

# 테스트할 모든 모델
declare -A MODELS
MODELS=(
  ["gemini-2.0-flash-exp"]="Gemini 2.0 Flash (기본 추천)"
  ["gemini-2.5-flash"]="Gemini 2.5 Flash"
  ["gemini-2.5-pro"]="Gemini 2.5 Pro"
  ["gemini-exp-1206"]="Gemini 3.1 Pro (실험)"
  ["gemini-3-flash"]="Gemini 3 Flash"
  ["gemini-3-pro"]="Gemini 3 Pro"
  ["gemini-1.5-flash"]="Gemini 1.5 Flash"
  ["gemini-1.5-flash-latest"]="Gemini 1.5 Flash (Latest)"
  ["gemini-1.5-pro"]="Gemini 1.5 Pro"
  ["gemini-1.5-pro-latest"]="Gemini 1.5 Pro (Latest)"
  ["gemini-1.5-flash-8b"]="Gemini 1.5 Flash-8B"
)

SUCCESS=0
FAILED=0
TOTAL=0

for MODEL in "${!MODELS[@]}"; do
  TOTAL=$((TOTAL + 1))
  LABEL="${MODELS[$MODEL]}"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔍 테스트 $TOTAL/11: $LABEL"
  echo "   모델: $MODEL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    --max-time 15 \
    -d "{
      \"message\": \"안녕하세요! 당신의 모델 이름을 알려주세요.\",
      \"systemPrompt\": \"당신은 친절한 AI 어시스턴트입니다. 첫 문장에 당신의 모델 이름을 간단히 언급하세요.\",
      \"model\": \"$MODEL\",
      \"temperature\": 0.7,
      \"maxTokens\": 200,
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
      echo "$RESPONSE_TEXT" | head -c 120
      echo "..."
      SUCCESS=$((SUCCESS + 1))
    else
      echo "⚠️  응답이 비어있음 (HTTP $HTTP_CODE)"
      FAILED=$((FAILED + 1))
    fi
  else
    echo "❌ 실패! (HTTP $HTTP_CODE)"
    ERROR_MSG=$(echo "$BODY" | jq -r '.error // .message // "알 수 없는 오류"' 2>/dev/null)
    echo "📥 오류: $ERROR_MSG"
    FAILED=$((FAILED + 1))
  fi
  
  echo ""
  sleep 1
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 최종 결과"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   전체: $TOTAL 개"
echo "   ✅ 성공: $SUCCESS 개"
echo "   ❌ 실패: $FAILED 개"
echo ""

if [ $SUCCESS -eq $TOTAL ]; then
  echo "🎉 모든 모델이 정상 작동합니다!"
elif [ $SUCCESS -gt 0 ]; then
  echo "⚠️  일부 모델만 작동합니다."
else
  echo "❗ 모든 모델이 실패했습니다."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
