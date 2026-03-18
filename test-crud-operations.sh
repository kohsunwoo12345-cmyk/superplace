#!/bin/bash

echo "============================================="
echo "반/학생/교사 생성 및 출석 코드 테스트"
echo "============================================="
echo ""

# 테스트용 임의 데이터
RANDOM_SUFFIX=$(date +%s)

echo "=== 1단계: 반(Class) 생성 테스트 ==="
echo "📝 새 반 생성 시도"

CLASS_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/admin/classes" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"테스트반${RANDOM_SUFFIX}\",
    \"academyId\": 1,
    \"description\": \"자동 테스트용 반\"
  }" \
  -s)

echo "$CLASS_RESPONSE" | jq '.'

CLASS_ID=$(echo "$CLASS_RESPONSE" | jq -r '.id // .classId // empty')

if [ -n "$CLASS_ID" ] && [ "$CLASS_ID" != "null" ]; then
  echo "✅ 반 생성 성공! classId=$CLASS_ID"
else
  echo "❌ 반 생성 실패 또는 API 없음"
fi

echo ""
echo ""
echo "=== 2단계: 학생 생성 테스트 ==="
echo "📝 새 학생 생성 시도"

STUDENT_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"student${RANDOM_SUFFIX}@test.com\",
    \"password\": \"test1234\",
    \"name\": \"테스트학생${RANDOM_SUFFIX}\",
    \"phone\": \"010-1234-5678\",
    \"role\": \"STUDENT\",
    \"academyId\": 1
  }" \
  -s)

echo "$STUDENT_RESPONSE" | jq '.'

STUDENT_ID=$(echo "$STUDENT_RESPONSE" | jq -r '.id // .userId // .user.id // empty')

if [ -n "$STUDENT_ID" ] && [ "$STUDENT_ID" != "null" ]; then
  echo "✅ 학생 생성 성공! studentId=$STUDENT_ID"
  
  echo ""
  echo "=== 3단계: 생성된 학생의 출석 코드 확인 ==="
  
  CODE_RESPONSE=$(curl -X GET "https://suplacestudy.com/api/students/attendance-code?userId=$STUDENT_ID" -s)
  echo "$CODE_RESPONSE" | jq '.'
  
  ATTENDANCE_CODE=$(echo "$CODE_RESPONSE" | jq -r '.code // empty')
  
  if [ -z "$ATTENDANCE_CODE" ] || [ "$ATTENDANCE_CODE" == "null" ]; then
    echo "⚠️ 출석 코드가 자동 생성되지 않음. 수동 생성 시도..."
    
    CREATE_CODE_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/attendance/code" \
      -H "Content-Type: application/json" \
      -d "{\"userId\": $STUDENT_ID, \"academyId\": 1}" \
      -s)
    
    echo "$CREATE_CODE_RESPONSE" | jq '.'
    ATTENDANCE_CODE=$(echo "$CREATE_CODE_RESPONSE" | jq -r '.code // empty')
  fi
  
  if [ -n "$ATTENDANCE_CODE" ] && [ "$ATTENDANCE_CODE" != "null" ]; then
    echo "✅ 출석 코드 확인: $ATTENDANCE_CODE"
    
    echo ""
    echo "=== 4단계: 출석 코드로 출석 인증 테스트 ==="
    
    VERIFY_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/attendance/verify" \
      -H "Content-Type: application/json" \
      -d "{\"code\": \"$ATTENDANCE_CODE\"}" \
      -s)
    
    echo "$VERIFY_RESPONSE" | jq '.'
    
    if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
      echo "✅ 출석 인증 성공!"
    else
      echo "❌ 출석 인증 실패!"
      if echo "$VERIFY_RESPONSE" | grep -qi "학생 정보를 찾을 수 없습니다"; then
        echo ""
        echo "🔍 문제 진단:"
        echo "  - studentId=$STUDENT_ID"
        echo "  - attendanceCode=$ATTENDANCE_CODE"
        echo "  - 원인: student_attendance_codes의 userId와 users의 id 불일치 가능성"
      fi
    fi
  else
    echo "❌ 출석 코드 생성 실패"
  fi
  
else
  echo "❌ 학생 생성 실패 또는 API 없음"
fi

echo ""
echo ""
echo "=== 5단계: 교사 생성 테스트 ==="
echo "📝 새 교사 생성 시도"

TEACHER_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"teacher${RANDOM_SUFFIX}@test.com\",
    \"password\": \"test1234\",
    \"name\": \"테스트교사${RANDOM_SUFFIX}\",
    \"phone\": \"010-9876-5432\",
    \"role\": \"TEACHER\",
    \"academyId\": 1
  }" \
  -s)

echo "$TEACHER_RESPONSE" | jq '.'

TEACHER_ID=$(echo "$TEACHER_RESPONSE" | jq -r '.id // .userId // .user.id // empty')

if [ -n "$TEACHER_ID" ] && [ "$TEACHER_ID" != "null" ]; then
  echo "✅ 교사 생성 성공! teacherId=$TEACHER_ID"
else
  echo "❌ 교사 생성 실패 또는 API 없음"
fi

echo ""
echo ""
echo "============================================="
echo "테스트 요약"
echo "============================================="
echo ""
echo "1. 반 생성: $([ -n "$CLASS_ID" ] && echo '✅ 성공' || echo '❌ 실패')"
echo "2. 학생 생성: $([ -n "$STUDENT_ID" ] && echo '✅ 성공' || echo '❌ 실패')"
echo "3. 출석 코드: $([ -n "$ATTENDANCE_CODE" ] && echo "✅ $ATTENDANCE_CODE" || echo '❌ 없음')"
echo "4. 출석 인증: (위 결과 참조)"
echo "5. 교사 생성: $([ -n "$TEACHER_ID" ] && echo '✅ 성공' || echo '❌ 실패')"
echo ""
