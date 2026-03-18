#!/bin/bash

echo "=== 실제 학생 코드로 테스트 ==="
echo ""

# 새 학생 생성
TIMESTAMP=$(date +%s)
STUDENT_EMAIL="real-test-${TIMESTAMP}@test.com"
STUDENT_NAME="실제테스트${TIMESTAMP}"

echo "1. 새 학생 생성"
CREATE_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$STUDENT_NAME\",
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"test123\",
    \"role\": \"STUDENT\",
    \"academyId\": \"1\"
  }")

echo "$CREATE_RESPONSE" | python3 -m json.tool

STUDENT_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('user', {}).get('id', ''))" 2>/dev/null)
CODE=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('attendanceCode', ''))" 2>/dev/null)

echo ""
echo "생성된 학생 ID: $STUDENT_ID"
echo "출석 코드: $CODE"

if [ -z "$CODE" ] || [ "$CODE" = "null" ]; then
  echo "❌ 출석 코드 생성 실패"
  exit 1
fi

echo ""
echo "2. 출석 인증 (API)"
VERIFY_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$CODE\"}")

echo "$VERIFY_RESPONSE" | python3 -m json.tool

# student.id 확인
STUDENT_ID_FROM_VERIFY=$(echo "$VERIFY_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('student', {}).get('id', ''))" 2>/dev/null)
STUDENT_NAME_FROM_VERIFY=$(echo "$VERIFY_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('student', {}).get('name', ''))" 2>/dev/null)

echo ""
echo "✅ 출석 인증에서 받은 정보:"
echo "   - student.id: $STUDENT_ID_FROM_VERIFY (타입: $(echo "$VERIFY_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); sid = data.get('student', {}).get('id'); print(type(sid).__name__)" 2>/dev/null))"
echo "   - student.name: $STUDENT_NAME_FROM_VERIFY"

if [ -n "$STUDENT_ID_FROM_VERIFY" ]; then
  echo ""
  echo "✅ student.id가 정상적으로 반환됨!"
  echo "   프론트엔드에서 studentInfo.userId = data.student.id 로 설정하면 됩니다."
else
  echo ""
  echo "❌ student.id가 null 또는 undefined"
fi

