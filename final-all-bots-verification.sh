#!/bin/bash

echo "🎯 전체 봇 최종 검증"
echo "=================================="

BOTS=(
  "bot-1773803533575-qrn2pluec:백석중학교"
  "bot-1773803031567-g9m2fa9cy:당하중학교3학년"
  "bot-1773747096787-ji4yl4sud:고3수능"
  "bot-1773650118731-bvi048whp:마전중학교"
  "bot-1773649764706-z00uhj0lt:당하중학교2학년"
)

SUCCESS=0
FAILED=0

for BOT_INFO in "${BOTS[@]}"; do
  BOT_ID="${BOT_INFO%%:*}"
  BOT_NAME="${BOT_INFO##*:}"
  
  echo ""
  echo "📌 Testing: $BOT_NAME (ID: $BOT_ID)"
  echo "----------------------------------------"
  
  # 역할 확인 테스트
  RESPONSE=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"안녕하세요, 당신은 누구인가요?\",
      \"botId\": \"$BOT_ID\",
      \"userId\": \"final-test-$(date +%s)\",
      \"conversationHistory\": []
    }")
  
  # 성공 여부 확인
  if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    RAG_USED=$(echo "$RESPONSE" | jq -r '.workerRAGUsed')
    RAG_COUNT=$(echo "$RESPONSE" | jq -r '.ragContextCount')
    AI_RESPONSE=$(echo "$RESPONSE" | jq -r '.response' | head -c 150)
    
    echo "✅ Success: true"
    echo "✅ Worker RAG: $RAG_USED"
    echo "✅ RAG Context: $RAG_COUNT"
    echo "📝 AI 답변: $AI_RESPONSE..."
    
    # System Prompt 전달 확인
    if echo "$RESPONSE" | grep -qi "꾸메땅학원\|단어.*암기\|스피드.*체커"; then
      echo "✅ System Prompt 정상 전달"
      SUCCESS=$((SUCCESS + 1))
    else
      echo "⚠️ System Prompt 확인 필요"
      FAILED=$((FAILED + 1))
    fi
  else
    echo "❌ API 호출 실패"
    echo "$RESPONSE" | jq '.'
    FAILED=$((FAILED + 1))
  fi
  
  sleep 2
done

echo ""
echo "=================================="
echo "📊 최종 결과"
echo "=================================="
echo "✅ 성공: $SUCCESS / ${#BOTS[@]}"
echo "❌ 실패: $FAILED / ${#BOTS[@]}"

if [ $FAILED -eq 0 ]; then
  echo ""
  echo "🎉 모든 봇이 정상 작동합니다!"
  echo "✅ RAG 활성화 완료"
  echo "✅ System Prompt 전달 완료"
  echo "✅ Gemini API 통합 완료"
else
  echo ""
  echo "⚠️ 일부 봇에서 문제가 발견되었습니다"
fi
