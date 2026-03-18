#!/bin/bash

echo "=== 학생 ID 50 상세 분석 ==="
echo ""

echo "1. 출석 코드 조회:"
CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=50")
echo "$CODE_RESPONSE" | jq '.'
echo ""

CODE=$(echo "$CODE_RESPONSE" | jq -r '.code')
echo "2. 출석 인증 시도 (코드: $CODE):"
VERIFY_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$CODE\"}")
echo "$VERIFY_RESPONSE" | jq '.'
echo ""

echo "3. 이 코드로 재시도 (5초 대기 후):"
sleep 5
VERIFY_RESPONSE2=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$CODE\"}")
echo "$VERIFY_RESPONSE2" | jq '.'
