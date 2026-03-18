#!/bin/bash

echo "=================================="
echo "🧪 V2 API 테스트"
echo "=================================="
echo ""

# 1. 출석 확인
echo "📞 1단계: 출석 확인"
ATTENDANCE_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify-phone" \
  -H "Content-Type: application/json" \
  -d '{"phone":"01051363624"}')

PHONE=$(echo "$ATTENDANCE_RESPONSE" | grep -o '"phone":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  - 전화번호: $PHONE"
echo ""

# 2. V2 API로 숙제 제출
echo "📝 2단계: V2 API로 숙제 제출"
echo "  - 엔드포인트: /api/homework-v2/submit"
echo ""

SUBMIT_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/homework-v2/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"images\": [\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\"]
  }")

echo "응답:"
echo "$SUBMIT_RESPONSE"
echo ""

# 결과 확인
if echo "$SUBMIT_RESPONSE" | grep -q '"success":true'; then
  echo "✅✅✅ V2 API 테스트 성공! ✅✅✅"
  echo ""
  echo "제출된 정보:"
  echo "$SUBMIT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SUBMIT_RESPONSE"
  exit 0
elif echo "$SUBMIT_RESPONSE" | grep -q '"error":"User not found"'; then
  echo "❌ 여전히 User not found 오류"
  exit 1
elif echo "$SUBMIT_RESPONSE" | grep -q "userId and images"; then
  echo "❌ 이전 코드가 아직 배포됨 (userId and images required)"
  exit 1
else
  echo "⚠️ 예상치 못한 응답"
  exit 1
fi
