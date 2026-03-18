#!/bin/bash

TIMESTAMP=$(date +%s)
echo "=== 즉시 테스트 (배포 완료됨) ==="
echo ""
echo "1. 학생 생성 테스트"
STUDENT_EMAIL="student-${TIMESTAMP}@test.com"
STUDENT_NAME="학생${TIMESTAMP}"

STUDENT_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$STUDENT_NAME\",
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"testpass123\",
    \"role\": \"STUDENT\",
    \"phone\": \"010-1111-2222\",
    \"academyId\": \"1\"
  }")

echo "$STUDENT_RESPONSE" | python3 -m json.tool

STUDENT_ID=$(echo "$STUDENT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('user', {}).get('id', ''))" 2>/dev/null)
ATTENDANCE_CODE=$(echo "$STUDENT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('attendanceCode', ''))" 2>/dev/null)

echo ""
echo "학생 ID: $STUDENT_ID"
echo "출석 코드: $ATTENDANCE_CODE"

if [ -n "$ATTENDANCE_CODE" ] && [ "$ATTENDANCE_CODE" != "null" ]; then
  echo ""
  echo "2. 출석 인증 테스트"
  VERIFY_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
    -H "Content-Type: application/json" \
    -d "{\"code\": \"$ATTENDANCE_CODE\"}")
  
  echo "$VERIFY_RESPONSE" | python3 -m json.tool
  
  VERIFY_SUCCESS=$(echo "$VERIFY_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('success', False))" 2>/dev/null)
  
  if [ "$VERIFY_SUCCESS" = "True" ]; then
    echo "✅ 출석 인증 성공!"
  else
    echo "❌ 출석 인증 실패"
  fi
fi

echo ""
echo "3. 교사 생성 테스트"
TEACHER_EMAIL="teacher-${TIMESTAMP}@test.com"
TEACHER_NAME="교사${TIMESTAMP}"

TEACHER_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TEACHER_NAME\",
    \"email\": \"$TEACHER_EMAIL\",
    \"password\": \"testpass123\",
    \"role\": \"TEACHER\",
    \"phone\": \"010-3333-4444\",
    \"academyId\": \"1\"
  }")

echo "$TEACHER_RESPONSE" | python3 -m json.tool

TEACHER_ID=$(echo "$TEACHER_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('user', {}).get('id', ''))" 2>/dev/null)

echo ""
echo "============================================="
echo "테스트 요약"
echo "============================================="
echo "1. 학생 생성: $([ -n "$STUDENT_ID" ] && echo "✅ 성공 (ID: $STUDENT_ID)" || echo '❌ 실패')"
echo "2. 출석 코드: $([ -n "$ATTENDANCE_CODE" ] && [ "$ATTENDANCE_CODE" != "null" ] && echo "✅ 생성됨 (코드: $ATTENDANCE_CODE)" || echo '❌ 없음')"
echo "3. 출석 인증: $([ "$VERIFY_SUCCESS" = "True" ] && echo '✅ 성공' || echo '❌ 실패')"
echo "4. 교사 생성: $([ -n "$TEACHER_ID" ] && echo "✅ 성공 (ID: $TEACHER_ID)" || echo '❌ 실패')"
echo "============================================="

