#!/bin/bash

echo "=== 최종 전화번호 출석 테스트 ==="
echo ""

PHONE="01051363624"

echo "⏳ Cloudflare Pages 배포 대기 (180초)..."
sleep 180
echo ""

echo "📱 테스트 전화번호: $PHONE"
echo ""

echo "🔍 API 호출 중..."
RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify-phone" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\"}")

echo "📦 API 응답:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 성공 여부 확인
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ 출석 성공!"
  STUDENT_NAME=$(echo "$RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
  STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  echo "   학생: $STUDENT_NAME"
  echo "   상태: $STATUS"
  echo ""
  echo "🎉 완벽하게 작동합니다!"
  echo ""
  echo "📝 브라우저 테스트:"
  echo "   1. https://superplacestudy.pages.dev/attendance-verify"
  echo "   2. 전화번호 입력: $PHONE"
  echo "   3. 출석 인증 버튼 클릭"
  echo "   4. 숙제 제출 화면으로 자동 이동"
else
  echo "❌ 출석 실패"
  ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo "   오류: $ERROR"
  
  if echo "$RESPONSE" | grep -q "해당 전화번호로 등록된 학생을 찾을 수 없습니다"; then
    echo ""
    echo "💡 해결 방법:"
    echo "   - 학생 관리 페이지에서 해당 전화번호로 학생 등록 필요"
    echo "   - 또는 다른 등록된 학생의 전화번호로 테스트"
  fi
fi

