#!/bin/bash

echo "============================================="
echo "최종 CRUD 테스트 (배포 대기 3분)"
echo "============================================="

echo "⏳ Cloudflare Pages 배포 대기 중..."
sleep 180

TIMESTAMP=$(date +%s)
echo ""
echo "=== 1. 학생 생성 테스트 ==="
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

echo "📝 학생 생성 응답:"
echo "$STUDENT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STUDENT_RESPONSE"

STUDENT_ID=$(echo "$STUDENT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('userId', ''))" 2>/dev/null)
ATTENDANCE_CODE_FROM_CREATE=$(echo "$STUDENT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('attendanceCode', ''))" 2>/dev/null)

if [ -z "$STUDENT_ID" ]; then
  echo "❌ 학생 생성 실패"
  exit 1
fi

echo "✅ 학생 생성 성공!"
echo "   - 학생 ID: $STUDENT_ID"
echo "   - 출석 코드: $ATTENDANCE_CODE_FROM_CREATE"

echo ""
echo "=== 2. 출석 코드로 출석하기 테스트 ==="
if [ -n "$ATTENDANCE_CODE_FROM_CREATE" ] && [ "$ATTENDANCE_CODE_FROM_CREATE" != "null" ]; then
  VERIFY_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
    -H "Content-Type: application/json" \
    -d "{\"code\": \"$ATTENDANCE_CODE_FROM_CREATE\"}")
  
  echo "📝 출석 인증 응답:"
  echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
  
  VERIFY_SUCCESS=$(echo "$VERIFY_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('success', False))" 2>/dev/null)
  
  if [ "$VERIFY_SUCCESS" = "True" ]; then
    echo "✅ 출석 인증 성공!"
  else
    echo "❌ 출석 인증 실패"
  fi
else
  echo "❌ 출석 코드가 없음"
fi

echo ""
echo "=== 3. 교사 생성 테스트 ==="
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

echo "📝 교사 생성 응답:"
echo "$TEACHER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TEACHER_RESPONSE"

TEACHER_ID=$(echo "$TEACHER_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('userId', ''))" 2>/dev/null)

if [ -z "$TEACHER_ID" ]; then
  echo "❌ 교사 생성 실패"
else
  echo "✅ 교사 생성 성공!"
  echo "   - 교사 ID: $TEACHER_ID"
fi

echo ""
echo "============================================="
echo "테스트 요약"
echo "============================================="
echo "1. 학생 생성: $([ -n "$STUDENT_ID" ] && echo '✅ 성공' || echo '❌ 실패')"
echo "2. 출석 코드 자동 생성: $([ -n "$ATTENDANCE_CODE_FROM_CREATE" ] && [ "$ATTENDANCE_CODE_FROM_CREATE" != "null" ] && echo '✅ 성공' || echo '❌ 실패')"
echo "3. 출석 인증: $([ "$VERIFY_SUCCESS" = "True" ] && echo '✅ 성공' || echo '❌ 실패')"
echo "4. 교사 생성: $([ -n "$TEACHER_ID" ] && echo '✅ 성공' || echo '❌ 실패')"
echo "============================================="

