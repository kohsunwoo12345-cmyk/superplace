#!/bin/bash
echo "🔍 503 에러 발생 여부 확인 중..."
echo ""

BOT_ID="bot-1773803533575-qrn2pluec"
TOTAL_TESTS=10
SUCCESS=0
FAIL_503=0
FAIL_OTHER=0

for i in $(seq 1 $TOTAL_TESTS); do
  echo "Test $i/$TOTAL_TESTS..."
  
  RESPONSE=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"테스트 메시지 $i\",
      \"botId\": \"$BOT_ID\",
      \"conversationHistory\": [],
      \"userId\": \"test-503-check-$i\"
    }")
  
  if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "  ✅ 성공"
    SUCCESS=$((SUCCESS+1))
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.error // .message')
    if echo "$ERROR" | grep -q "503"; then
      echo "  ❌ 503 에러 발생"
      FAIL_503=$((FAIL_503+1))
    else
      echo "  ❌ 기타 에러: $ERROR"
      FAIL_OTHER=$((FAIL_OTHER+1))
    fi
  fi
  
  sleep 1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 테스트 결과"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 성공: $SUCCESS/$TOTAL_TESTS"
echo "❌ 503 에러: $FAIL_503/$TOTAL_TESTS"
echo "❌ 기타 에러: $FAIL_OTHER/$TOTAL_TESTS"
echo ""

if [ $FAIL_503 -gt 0 ]; then
  echo "⚠️ 503 에러가 여전히 발생하고 있습니다."
  echo "추가 개선이 필요합니다."
else
  echo "🎉 503 에러 없음!"
fi
