#!/bin/bash

echo "🔍 실제 학생 데이터로 테스트"
echo "================================"
echo ""

# 실제 사용자 이메일 사용 (wangholy1@naver.com)
TEST_DATA='{
  "recipients": [
    {
      "studentEmail": "wangholy1@naver.com",
      "parentName": "고희준 학부모",
      "parentPhone": "010-1234-5678"
    }
  ]
}'

echo "📤 실제 사용자 이메일로 테스트 중..."
echo "   학생 이메일: wangholy1@naver.com"
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

if [ "$SUCCESS" == "true" ]; then
  READY=$(echo "$RESPONSE" | jq -r '.stats.ready')
  
  if [ "$READY" -gt 0 ]; then
    echo "✅ 처리 성공!"
    echo ""
    echo "📋 매칭된 데이터:"
    echo "$RESPONSE" | jq -r '.recipients[] | select(.status == "READY") | "
학생 ID: \(.studentId)
학생 이메일: \(.studentEmail)
학생 이름: \(.studentName)
학부모 이름: \(.parentName)
학부모 연락처: \(.parentPhone)
리포트 ID: \(.reportId)
리포트 제목: \(.reportTitle)
랜딩페이지 URL: \(.landingPageUrl)
"'
  else
    echo "⚠️  처리 실패"
    echo "$RESPONSE" | jq -r '.recipients[0] | "상태: \(.status)\n오류: \(.error)"'
  fi
else
  echo "❌ API 호출 실패!"
  echo "$RESPONSE" | jq -r '.error'
fi
