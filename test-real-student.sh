#!/bin/bash

echo "=== 실제 존재하는 학생으로 테스트 ==="
echo ""

echo "1. 학생 ID 157 정보 확인 (검색 API로 확인된 학생)"
STUDENT=$(curl -s "https://suplacestudy.com/api/admin/search-student?name=%EA%B3%A0%EC%84%A0%EC%9A%B0")
echo "$STUDENT" | jq '.students[0] | {id, name, email, student_code, attendanceCode}'
echo ""

STUDENT_CODE=$(echo "$STUDENT" | jq -r '.students[0].student_code // empty')
STUDENT_ID=$(echo "$STUDENT" | jq -r '.students[0].id')

if [ ! -z "$STUDENT_CODE" ]; then
  echo "2. 이 학생의 상세 페이지 URL:"
  echo "   https://superplacestudy.pages.dev/dashboard/students/detail/?id=$STUDENT_CODE"
  echo ""
  
  echo "3. 출석 코드 API 직접 확인 (숫자 ID: $STUDENT_ID):"
  CODE_RESP=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$STUDENT_ID")
  echo "$CODE_RESP" | jq '.'
  
  CODE=$(echo "$CODE_RESP" | jq -r '.code')
  echo ""
  echo "✅ 출석 코드: $CODE"
  echo ""
  echo "4. 프론트엔드 테스트 URL (이 URL로 접속하세요):"
  echo "   https://superplacestudy.pages.dev/dashboard/students/detail/?id=$STUDENT_CODE"
else
  echo "❌ student_code를 찾을 수 없습니다"
  echo ""
  echo "대체 방법: 숫자 ID로 직접 접속"
  echo "   https://superplacestudy.pages.dev/dashboard/students/detail/?id=157"
fi
