#!/bin/bash

echo "=================================="
echo "🧪 최종 검증 테스트"
echo "=================================="
echo ""

# 1. 출석 확인으로 userId 얻기
echo "📞 1단계: 출석 확인 (전화번호로 userId 조회)"
ATTENDANCE_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify-phone" \
  -H "Content-Type: application/json" \
  -d '{"phone":"01051363624"}')

echo "응답: $ATTENDANCE_RESPONSE"
echo ""

USER_ID=$(echo "$ATTENDANCE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
USER_NAME=$(echo "$ATTENDANCE_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
PHONE=$(echo "$ATTENDANCE_RESPONSE" | grep -o '"phone":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "추출된 정보:"
echo "  - ID: $USER_ID"
echo "  - 이름: $USER_NAME"
echo "  - 전화번호: $PHONE"
echo ""

if [ -z "$PHONE" ]; then
  echo "❌ 전화번호를 추출할 수 없습니다."
  exit 1
fi

# 2. 숙제 제출 (phone만 사용)
echo "📝 2단계: 숙제 제출 (phone 사용)"
echo "  - phone: $PHONE"
echo ""

SUBMIT_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"images\": [\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\"]
  }")

echo "응답: $SUBMIT_RESPONSE"
echo ""

# 결과 확인
if echo "$SUBMIT_RESPONSE" | grep -q '"success":true'; then
  echo "✅ 테스트 성공!"
  echo ""
  echo "제출된 정보:"
  echo "$SUBMIT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1
  echo "$SUBMIT_RESPONSE" | grep -o '"userId":"[^"]*"'
  echo "$SUBMIT_RESPONSE" | grep -o '"studentName":"[^"]*"'
  exit 0
elif echo "$SUBMIT_RESPONSE" | grep -q '"error":"User not found"'; then
  echo "❌ 테스트 실패: User not found 오류 발생"
  exit 1
else
  echo "⚠️ 예상치 못한 응답"
  exit 1
fi
