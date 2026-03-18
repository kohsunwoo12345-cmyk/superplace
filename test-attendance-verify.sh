#!/bin/bash

# 출석 인증 테스트
echo "=== 출석 인증 엔드포인트 테스트 ==="
echo ""

# 테스트용 출석 코드 (실제 DB에 있어야 함)
TEST_CODE="123456"

echo "📝 Test 1: 출석 코드로 출석 인증"
curl -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$TEST_CODE\"}" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "✅ 테스트 완료"
