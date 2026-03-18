#!/bin/bash

echo "========================================="
echo "🧪 최종 V2 API 테스트"
echo "========================================="
echo ""

# 전화번호로 직접 테스트
PHONE="01051363624"

echo "📝 숙제 제출 테스트"
echo "  - 엔드포인트: /api/homework-v2/submit"
echo "  - 전화번호: $PHONE"
echo ""

SUBMIT_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/homework-v2/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"images\": [\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\"]
  }")

echo "📡 응답:"
echo "$SUBMIT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SUBMIT_RESPONSE"
echo ""

# 결과 확인
if echo "$SUBMIT_RESPONSE" | grep -q '"success":true'; then
  echo "✅✅✅ 성공! ✅✅✅"
  echo ""
  echo "제출 ID: $(echo "$SUBMIT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)"
  echo "사용자 ID: $(echo "$SUBMIT_RESPONSE" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)"
  echo "학생 이름: $(echo "$SUBMIT_RESPONSE" | grep -o '"studentName":"[^"]*"' | cut -d'"' -f4)"
  exit 0
else
  echo "❌ 실패"
  exit 1
fi
