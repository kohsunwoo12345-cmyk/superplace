#!/bin/bash

echo "=== 해당 학생의 숫자 ID 찾기 ==="
echo ""

STUDENT_CODE="student-1772865608071-3s67r1wq6n5"
EMAIL="student_1772865608071@temp.superplace.local"

echo "Student Code: $STUDENT_CODE"
echo "Email: $EMAIL"
echo ""

# Try to find by various methods
echo "1. 이메일 부분으로 검색 (1772865608071)..."
SEARCH1=$(curl -s "https://suplacestudy.com/api/admin/search-student?name=1772865608071")
COUNT1=$(echo "$SEARCH1" | jq -r '.count // 0')
echo "   결과: $COUNT1명"

if [ "$COUNT1" -gt 0 ]; then
  echo "$SEARCH1" | jq -r '.students[] | "   ID: \(.id), 이름: \(.name), 이메일: \(.email), 코드: \(.attendanceCode // "없음")"'
fi
echo ""

echo "2. temp.superplace.local 이메일로 검색..."
SEARCH2=$(curl -s "https://suplacestudy.com/api/admin/search-student?name=temp.superplace")
COUNT2=$(echo "$SEARCH2" | jq -r '.count // 0')
echo "   결과: $COUNT2명 (처음 5명만 표시)"

if [ "$COUNT2" -gt 0 ]; then
  echo "$SEARCH2" | jq -r '.students[0:5][] | "   ID: \(.id), 이메일: \(.email)"'
fi
echo ""

echo "3. 최근 생성된 학생 확인 (ID 250-300)..."
for ID in {290..300}; do
  CODE_RESP=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID" 2>/dev/null)
  if echo "$CODE_RESP" | jq -e '.success == true' >/dev/null 2>&1; then
    CODE=$(echo "$CODE_RESP" | jq -r '.code')
    echo "   ID $ID: 코드 $CODE 있음"
  fi
done
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "해당 학생의 숫자 ID를 찾으면, 다음 명령으로 출석 코드 확인:"
echo "  curl 'https://suplacestudy.com/api/students/attendance-code?userId=숫자ID'"
echo ""
echo "F12 Console에서 다음을 확인하세요:"
echo "  1. '🎯 Fetching attendance code for numeric userId: X'"
echo "  2. '📡 Attendance code response status: XXX'"
echo "  3. '📦 Attendance code data: ...'"
