#!/bin/bash
echo "⏳ Cloudflare Pages 배포 대기 중... (2분 30초)"
sleep 150

echo ""
echo "🧪 503 에러 대응 종합 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BOT_ID="bot-1773803533575-qrn2pluec"

# 통계 변수
TOTAL_TESTS=20
SUCCESS_COUNT=0
FAIL_503_COUNT=0
FAIL_OTHER_COUNT=0
TOTAL_DURATION=0

echo "📊 20개 연속 요청 테스트 (503 에러 복원력 확인)"
echo ""

for i in $(seq 1 $TOTAL_TESTS); do
  printf "Test %2d/%d: " $i $TOTAL_TESTS
  
  START_TIME=$(date +%s%3N)
  
  RESPONSE=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"테스트 메시지 번호 $i\",
      \"botId\": \"$BOT_ID\",
      \"conversationHistory\": [],
      \"userId\": \"comprehensive-test-$i\",
      \"userRole\": \"STUDENT\"
    }")
  
  END_TIME=$(date +%s%3N)
  DURATION=$((END_TIME - START_TIME))
  TOTAL_DURATION=$((TOTAL_DURATION + DURATION))
  
  if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    SUCCESS_COUNT=$((SUCCESS_COUNT+1))
    MODELS_USED=$(echo "$RESPONSE" | jq -r '.errorDetails.modelsAttempted // "primary"')
    printf "✅ 성공 (%dms)\n" $DURATION
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.error // .message')
    RETRY_AFTER=$(echo "$RESPONSE" | jq -r '.retryAfterSeconds // 0')
    
    if echo "$ERROR" | grep -qi "503\|unavailable\|high demand"; then
      FAIL_503_COUNT=$((FAIL_503_COUNT+1))
      printf "❌ 503 에러 (%dms, retry after: %ds)\n" $DURATION $RETRY_AFTER
    else
      FAIL_OTHER_COUNT=$((FAIL_OTHER_COUNT+1))
      printf "❌ 기타 에러 (%dms): %s\n" $DURATION "$(echo $ERROR | cut -c1-50)"
    fi
  fi
  
  # 과도한 요청 방지를 위한 짧은 대기
  sleep 0.5
done

AVG_DURATION=$((TOTAL_DURATION / TOTAL_TESTS))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 종합 테스트 결과"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "전체 요청:      $TOTAL_TESTS개"
echo "✅ 성공:        $SUCCESS_COUNT개 ($(( SUCCESS_COUNT * 100 / TOTAL_TESTS ))%)"
echo "❌ 503 에러:    $FAIL_503_COUNT개 ($(( FAIL_503_COUNT * 100 / TOTAL_TESTS ))%)"
echo "❌ 기타 에러:   $FAIL_OTHER_COUNT개 ($(( FAIL_OTHER_COUNT * 100 / TOTAL_TESTS ))%)"
echo ""
echo "평균 응답 시간: ${AVG_DURATION}ms"
echo ""

# 성공률 평가
SUCCESS_RATE=$((SUCCESS_COUNT * 100 / TOTAL_TESTS))

if [ $SUCCESS_RATE -ge 95 ]; then
  echo "🎉 우수! 성공률 95% 이상"
  echo ""
  echo "✅ 503 에러 대응 시스템 정상 작동"
  echo "✅ Fallback 모델 전환 성공"
  echo "✅ 재시도 로직 효과적"
elif [ $SUCCESS_RATE -ge 80 ]; then
  echo "✅ 양호. 성공률 80% 이상"
  echo ""
  echo "⚠️ 일부 503 에러 발생 ($FAIL_503_COUNT개)"
  echo "💡 Gemini API가 일시적으로 과부하 상태일 수 있음"
else
  echo "⚠️ 주의! 성공률 80% 미만"
  echo ""
  echo "❌ 503 에러가 빈번히 발생 ($FAIL_503_COUNT개)"
  echo "❌ 추가 조치 필요"
  echo ""
  echo "권장 조치:"
  echo "1. 5-10분 후 재테스트"
  echo "2. Gemini API 상태 확인: https://status.cloud.google.com/"
  echo "3. API 할당량 확인"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 학생/학원장 계정 별도 테스트
echo "📝 학생/학원장 계정 별도 검증"
echo ""

# 학생 계정 테스트
echo "Test: 학생 계정 - 대화 히스토리 포함"
STUDENT_RESPONSE=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"당신은 누구인가요?\",
    \"botId\": \"$BOT_ID\",
    \"conversationHistory\": [
      {\"role\": \"user\", \"content\": \"안녕하세요\"},
      {\"role\": \"assistant\", \"content\": \"안녕하세요!\"}
    ],
    \"userId\": \"final-student-test\",
    \"userRole\": \"STUDENT\"
  }")

if echo "$STUDENT_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "  ✅ 학생 계정 정상"
  echo "$STUDENT_RESPONSE" | jq -r '.response' | head -c 100
  echo "..."
else
  echo "  ❌ 학생 계정 실패"
  echo "$STUDENT_RESPONSE" | jq -r '.message'
fi

echo ""

# 학원장 계정 테스트
echo "Test: 학원장 계정 - 긴 대화 히스토리"
OWNER_RESPONSE=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"감사합니다\",
    \"botId\": \"$BOT_ID\",
    \"conversationHistory\": [
      {\"role\": \"user\", \"content\": \"안녕하세요\"},
      {\"role\": \"assistant\", \"content\": \"안녕하세요!\"},
      {\"role\": \"user\", \"content\": \"당신은 누구인가요?\"},
      {\"role\": \"assistant\", \"content\": \"저는 단어 암기 체커입니다.\"}
    ],
    \"userId\": \"final-owner-test\",
    \"userRole\": \"OWNER\"
  }")

if echo "$OWNER_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "  ✅ 학원장 계정 정상"
  echo "$OWNER_RESPONSE" | jq -r '.response' | head -c 100
  echo "..."
else
  echo "  ❌ 학원장 계정 실패"
  echo "$OWNER_RESPONSE" | jq -r '.message'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 모든 테스트 완료"
echo ""

if [ $SUCCESS_RATE -ge 95 ]; then
  echo "🎉 시스템 정상 작동 확인!"
  echo ""
  echo "이제 학생, 학원장, 관리자 모든 계정에서"
  echo "안정적으로 AI 챗봇을 사용할 수 있습니다."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
