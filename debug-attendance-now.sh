#!/bin/bash

echo "=== 실시간 출석 디버깅 ==="
echo ""
echo "1. 최근 생성된 학생의 출석 코드 조회"

# 방금 생성한 학생 ID 267의 출석 코드
curl -s "https://suplacestudy.com/api/attendance/code?userId=267" | python3 -m json.tool

echo ""
echo "2. 해당 코드로 출석 시도"
CODE="078160"

VERIFY_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$CODE\"}")

echo "$VERIFY_RESPONSE" | python3 -m json.tool

echo ""
echo "3. student_attendance_codes 테이블 직접 조회"
curl -s "https://suplacestudy.com/api/attendance/code?userId=267" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'코드: {data.get(\"code\")}')
print(f'userId: {data.get(\"userId\")}')
print(f'isActive: {data.get(\"isActive\")}')
"

