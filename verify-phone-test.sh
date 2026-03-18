#!/bin/bash

echo "=== 전화번호 출석 API 직접 테스트 ==="
echo ""

PHONE="01051363624"

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
  echo "   학생: $STUDENT_NAME"
elif echo "$RESPONSE" | grep -q '"success":false'; then
  echo "❌ 출석 실패"
  ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo "   오류: $ERROR"
fi
echo ""

echo "💡 브라우저에서 테스트:"
echo "   1. https://superplacestudy.pages.dev/attendance-verify 접속"
echo "   2. 전화번호 입력: 01051363624"
echo "   3. 출석 인증 버튼 클릭"
echo "   4. F12 콘솔에서 로그 확인"

