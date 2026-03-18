#!/bin/bash

echo "=== 실패 학생 상세 디버그 (ID 18) ==="
echo ""

echo "1. 학생 코드 조회:"
CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=18")
echo "$CODE_RESPONSE" | jq '.' 2>/dev/null || echo "$CODE_RESPONSE"
echo ""

CODE=$(echo "$CODE_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
echo "2. 추출된 코드: $CODE"
echo ""

echo "3. 출석 인증 시도:"
VERIFY_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$CODE\"}")
echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

echo "4. student_attendance_codes 테이블 직접 조회:"
curl -s -X POST "https://suplacestudy.com/api/debug/check-attendance-code" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$CODE\"}" | jq '.' 2>/dev/null
echo ""

echo "5. users 테이블에서 학생 정보 조회:"
curl -s "https://suplacestudy.com/api/debug/check-user?userId=18" | jq '.' 2>/dev/null

