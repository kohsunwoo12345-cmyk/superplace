#!/bin/bash

echo "📊 실제 발송 직전 테스트 - 엑셀 시뮬레이션"
echo "=========================================="
echo ""

# 3명의 테스트 데이터
TEST_DATA='{
  "recipients": [
    {
      "studentEmail": "admin@superplace.co.kr",
      "parentName": "관리자 학부모",
      "parentPhone": "010-1111-1111"
    },
    {
      "studentEmail": "superplace12@gmail.com",
      "parentName": "고선우 학부모",
      "parentPhone": "010-2222-2222"
    },
    {
      "studentEmail": "wangholy1@naver.com",
      "parentName": "고희준 학부모",
      "parentPhone": "010-3333-3333"
    }
  ]
}'

echo "📤 bulk-prepare API 테스트 중..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# API 호출
RESPONSE=$(curl -s -X POST \
  "https://superplacestudy.pages.dev/api/kakao/bulk-prepare" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo "$RESPONSE" | jq '.'

echo ""
echo "=========================================="
echo "📊 통계"
echo "=========================================="

TOTAL=$(echo "$RESPONSE" | jq -r '.stats.total')
READY=$(echo "$RESPONSE" | jq -r '.stats.ready')
NOT_FOUND=$(echo "$RESPONSE" | jq -r '.stats.notFound')
NO_REPORT=$(echo "$RESPONSE" | jq -r '.stats.noReport')

echo "총 인원: $TOTAL명"
echo "처리 완료: $READY명 ✅"
echo "사용자 없음: $NOT_FOUND명"
echo "랜딩페이지 없음: $NO_REPORT명"

echo ""
echo "=========================================="
echo "📋 상세 결과"
echo "=========================================="
echo ""

# 처리 완료된 수신자
if [ "$READY" -gt 0 ]; then
  echo "✅ 발송 준비 완료:"
  echo "$RESPONSE" | jq -r '.recipients[] | select(.status == "READY") | "
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  👤 \(.studentName) (\(.studentEmail))
  📞 학부모: \(.parentName) (\(.parentPhone))
  🔗 URL: \(.landingPageUrl | .[0:80])...
  "' 
fi

# 랜딩페이지 없음
if [ "$NO_REPORT" -gt 0 ]; then
  echo "⚠️  랜딩페이지 없음:"
  echo "$RESPONSE" | jq -r '.recipients[] | select(.status == "NO_REPORT") | "  - \(.studentName) (\(.studentEmail))"'
  echo ""
fi

echo ""
echo "=========================================="
echo "🎯 다음 단계: 실제 발송 페이지에서 테스트"
echo "=========================================="
echo ""
echo "1. 엑셀 파일 준비:"
echo "   - 학생이메일: admin@superplace.co.kr"
echo "   - 학부모이름: 관리자 학부모"
echo "   - 학부모연락처: 010-1111-1111"
echo ""
echo "2. 발송 페이지 접속:"
echo "   https://superplacestudy.pages.dev/dashboard/kakao-alimtalk/send/"
echo ""
echo "3. 설정:"
echo "   - 채널: 꾸메땅학원"
echo "   - 템플릿: 기본 템플릿 3 - 학습 안내"
echo "   - 엑셀 업로드"
echo ""
echo "4. 미리보기에서 확인할 내용:"
echo "   - #{name} → 관리자 학부모"
echo "   - #{url} → https://superplacestudy.pages.dev/landing/31?studentId=1&..."
echo ""
echo "5. ⚠️ '발송' 버튼은 클릭하지 마세요 (실제 발송됨!)"
echo ""
