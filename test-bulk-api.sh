#!/bin/bash

echo "🧪 알림톡 대량 발송 API 테스트"
echo "================================"
echo ""

# 테스트 데이터
TEST_DATA='{
  "recipients": [
    {
      "studentEmail": "student001@kumettang.com",
      "parentName": "김영희",
      "parentPhone": "010-1234-5678"
    },
    {
      "studentEmail": "student002@kumettang.com",
      "parentName": "이철수",
      "parentPhone": "010-2345-6789"
    },
    {
      "studentEmail": "student003@kumettang.com",
      "parentName": "박민수",
      "parentPhone": "010-3456-7890"
    },
    {
      "studentEmail": "notexist@kumettang.com",
      "parentName": "존재안함",
      "parentPhone": "010-9999-9999"
    }
  ],
  "academyId": "academy-1771479246368-5viyubmqk"
}'

echo "📤 bulk-prepare API 테스트 중..."
echo ""

# API 호출
RESPONSE=$(curl -s -X POST \
  "https://superplacestudy.pages.dev/api/kakao/bulk-prepare" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo "📥 API 응답:"
echo "$RESPONSE" | jq '.'

echo ""
echo "================================"
echo ""

# 결과 분석
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
TOTAL=$(echo "$RESPONSE" | jq -r '.stats.total')
READY=$(echo "$RESPONSE" | jq -r '.stats.ready')
NOT_FOUND=$(echo "$RESPONSE" | jq -r '.stats.notFound')
NO_REPORT=$(echo "$RESPONSE" | jq -r '.stats.noReport')

if [ "$SUCCESS" == "true" ]; then
  echo "✅ API 호출 성공!"
  echo ""
  echo "📊 통계:"
  echo "   - 전체: $TOTAL명"
  echo "   - 처리 완료: $READY명"
  echo "   - 학생 없음: $NOT_FOUND명"
  echo "   - 리포트 없음: $NO_REPORT명"
  echo ""
  
  if [ "$READY" -gt 0 ]; then
    echo "✅ 처리 완료된 수신자 상세:"
    echo "$RESPONSE" | jq -r '.recipients[] | select(.status == "READY") | "   - \(.studentName) (\(.studentEmail))\n     학부모: \(.parentName) (\(.parentPhone))\n     URL: \(.landingPageUrl)\n"'
  fi
  
  if [ "$NOT_FOUND" -gt 0 ]; then
    echo "⚠️  학생을 찾을 수 없음:"
    echo "$RESPONSE" | jq -r '.recipients[] | select(.status == "NOT_FOUND") | "   - \(.studentEmail): \(.error)"'
  fi
else
  echo "❌ API 호출 실패!"
  echo "$RESPONSE" | jq -r '.error'
fi

echo ""
echo "================================"
echo ""
echo "🔍 다음 단계:"
echo "1. 위 결과에서 URL이 제대로 생성되었는지 확인"
echo "2. 발송 페이지에서 엑셀 업로드 테스트"
echo "3. 미리보기에서 메시지 치환 확인"
echo ""
