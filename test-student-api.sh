#!/bin/bash

echo "=== 학생 조회 API 테스트 ==="
echo ""

STUDENT_CODE="student-1772865608071-3s67r1wq6n5"

echo "1. by-academy API로 조회 (student_code)..."
echo "   URL: /api/students/by-academy?id=$STUDENT_CODE"
RESP1=$(curl -s "https://suplacestudy.com/api/students/by-academy?id=$STUDENT_CODE")
echo "$RESP1" | jq '.' 2>/dev/null || echo "$RESP1"
echo ""

echo "2. 실제 존재하는 학생으로 테스트 (ID 1)..."
echo "   - student_code 확인 필요"
RESP2=$(curl -s "https://suplacestudy.com/api/students/by-academy?id=1")
echo "$RESP2" | jq '{student: {id, name, email, student_code}}' 2>/dev/null || echo "실패"
echo ""

echo "3. 존재하는 학생의 student_code로 조회..."
EXISTING_CODE=$(echo "$RESP2" | jq -r '.student.student_code // .student_code // empty')
if [ ! -z "$EXISTING_CODE" ]; then
  echo "   Code: $EXISTING_CODE"
  RESP3=$(curl -s "https://suplacestudy.com/api/students/by-academy?id=$EXISTING_CODE")
  echo "$RESP3" | jq '{success, student: {id, name}}' 2>/dev/null || echo "실패"
else
  echo "   student_code 없음"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "결론:"
echo "  - student-1772865608071-3s67r1wq6n5는 DB에 없음"
echo "  - 학생이 생성되지 않았거나 삭제됨"
echo "  - 프론트엔드는 studentData가 없어서 출석 코드 못 가져옴"
