#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 모든 Gemini 모델 API 호출 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="https://superplacestudy.pages.dev"
API_ENDPOINT="${BASE_URL}/api/ai/chat"

# 테스트할 모든 모델
declare -A MODELS=(
  ["gemini-2.0-flash-exp"]="Gemini 2.0 Flash (기본)"
  ["gemini-2.5-flash"]="Gemini 2.5 Flash"
  ["gemini-2.5-pro"]="Gemini 2.5 Pro"
  ["gemini-exp-1206"]="Gemini 3.1 Pro"
  ["gemini-3-flash"]="Gemini 3 Flash"
  ["gemini-3-pro"]="Gemini 3 Pro"
  ["gemini-1.5-flash"]="Gemini 1.5 Flash"
  ["gemini-1.5-flash-latest"]="Gemini 1.5 Flash Latest"
  ["gemini-1.5-pro"]="Gemini 1.5 Pro"
  ["gemini-1.5-pro-latest"]="Gemini 1.5 Pro Latest"
  ["gemini-1.5-flash-8b"]="Gemini 1.5 Flash 8B"
)

SUCCESS=0
FAILED=0
TOTAL=${#MODELS[@]}

echo "📍 테스트 URL: ${API_ENDPOINT}"
echo "📊 총 ${TOTAL}개 모델 테스트"
echo ""

for MODEL in "${!MODELS[@]}"; do
  LABEL="${MODELS[$MODEL]}"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  printf "🔍 테스트: %-40s\n" "$LABEL"
  printf "   모델명: %-40s\n" "$MODEL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 30 -X POST "${API_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"안녕하세요! 당신의 이름을 알려주세요.\",
      \"systemPrompt\": \"당신은 친절한 AI 어시스턴트입니다. 간단히 한 문장으로 답하세요.\",
      \"model\": \"${MODEL}\",
      \"temperature\": 0.7,
      \"maxTokens\": 100,
      \"topK\": 40,
      \"topP\": 0.95
    }")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    RESPONSE_TEXT=$(echo "$BODY" | jq -r '.response' 2>/dev/null)
    if [ ! -z "$RESPONSE_TEXT" ] && [ "$RESPONSE_TEXT" != "null" ]; then
      echo "✅ 성공! (HTTP ${HTTP_CODE})"
      echo "📥 응답: ${RESPONSE_TEXT:0:100}..."
      SUCCESS=$((SUCCESS + 1))
    else
      echo "⚠️  응답 비어있음 (HTTP ${HTTP_CODE})"
      echo "📥 원본: $BODY"
      FAILED=$((FAILED + 1))
    fi
  else
    echo "❌ 실패! (HTTP ${HTTP_CODE})"
    ERROR_MSG=$(echo "$BODY" | jq -r '.error // .details // "알 수 없는 오류"' 2>/dev/null)
    echo "📥 오류: ${ERROR_MSG:0:200}"
    FAILED=$((FAILED + 1))
  fi
  
  echo ""
  sleep 0.5
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 테스트 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 최종 결과:"
echo "   전체: ${TOTAL}개"
echo "   ✅ 성공: ${SUCCESS}개"
echo "   ❌ 실패: ${FAILED}개"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 모든 모델이 정상 작동합니다!"
  exit 0
else
  echo "⚠️  일부 모델에서 오류가 발생했습니다."
  exit 1
fi
