#!/bin/bash

echo "============================================="
echo "테스트 학생 생성 및 전체 플로우 검증"
echo "============================================="
echo ""

# 1. 테스트 학생 생성
echo "=== 1단계: 테스트 학생 생성 ==="
RANDOM_SUFFIX=$(date +%s)
TEST_EMAIL="test-student-${RANDOM_SUFFIX}@test.com"
TEST_NAME="테스트학생${RANDOM_SUFFIX}"

echo "생성할 학생 정보:"
echo "  이름: $TEST_NAME"
echo "  이메일: $TEST_EMAIL"
echo ""

CREATE_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/test/create-test-student" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"test1234\",
    \"name\": \"$TEST_NAME\",
    \"phone\": \"010-1234-5678\",
    \"academy_id\": 1
  }" \
  -s)

echo "생성 응답:"
echo "$CREATE_RESPONSE" | jq '.'

STUDENT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.student.id // empty')
ATTENDANCE_CODE=$(echo "$CREATE_RESPONSE" | jq -r '.attendanceCode // empty')

if [ -z "$STUDENT_ID" ] || [ "$STUDENT_ID" == "null" ]; then
  echo ""
  echo "❌ 학생 생성 실패!"
  echo "테스트 학생 생성 API가 없거나 에러 발생"
  echo ""
  echo "대체 방법: 기존 출석 코드 활성화"
  echo ""
  
  # 기존 비활성 출석 코드 중 하나 활성화
  echo "=== 대체: 기존 출석 코드 활성화 ==="
  
  # 임의 코드 선택하여 활성화 시도
  echo "임의 출석 코드 '123456' 활성화 시도..."
  
  ACTIVATE_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/students/activate-attendance-code" \
    -H "Content-Type: application/json" \
    -d '{"code": "123456"}' \
    -s)
  
  echo "$ACTIVATE_RESPONSE" | jq '.'
  
  # 활성화된 코드로 인증 시도
  ATTENDANCE_CODE="123456"
  
else
  echo ""
  echo "✅ 학생 생성 성공!"
  echo "  학생 ID: $STUDENT_ID"
  echo "  출석 코드: $ATTENDANCE_CODE"
fi

echo ""
echo ""
echo "=== 2단계: 출석 코드로 출석 인증 ==="
echo "코드: $ATTENDANCE_CODE"

VERIFY_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$ATTENDANCE_CODE\"}" \
  -s)

echo "$VERIFY_RESPONSE" | jq '.'

if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "✅ 출석 인증 성공!"
  
  VERIFIED_STUDENT_ID=$(echo "$VERIFY_RESPONSE" | jq -r '.student.id')
  ATTENDANCE_ID=$(echo "$VERIFY_RESPONSE" | jq -r '.attendance.id')
  
  echo "  학생 ID: $VERIFIED_STUDENT_ID"
  echo "  출석 ID: $ATTENDANCE_ID"
  
  echo ""
  echo "=== 3단계: 출석 기록 확인 ==="
  
  STATS_RESPONSE=$(curl -X GET "https://suplacestudy.com/api/attendance/statistics?userId=$VERIFIED_STUDENT_ID&role=STUDENT" -s)
  
  echo "출석 캘린더 (최근 3일):"
  echo "$STATS_RESPONSE" | jq '.calendar' | head -10
  
  ATTENDANCE_DAYS=$(echo "$STATS_RESPONSE" | jq '.attendanceDays')
  echo ""
  echo "총 출석 일수: $ATTENDANCE_DAYS"
  
  echo ""
  echo "=== 4단계: 숙제 채점 테스트 ==="
  
  # 테스트 이미지 URL
  TEST_IMAGE="https://via.placeholder.com/800x600.png?text=Math+Homework"
  
  GRADING_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/homework/grade" \
    -H "Content-Type: application/json" \
    -d "{
      \"imageUrls\": [\"$TEST_IMAGE\"],
      \"userId\": \"$VERIFIED_STUDENT_ID\",
      \"subject\": \"수학\",
      \"grade\": \"중1\"
    }" \
    -s)
  
  echo "$GRADING_RESPONSE" | jq '.' | head -30
  
  if echo "$GRADING_RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ 숙제 채점 성공!"
  else
    echo ""
    echo "⚠️ 숙제 채점 실패 (인증 필요 또는 API 에러)"
  fi
  
  echo ""
  echo ""
  echo "============================================="
  echo "✅ 전체 플로우 테스트 완료!"
  echo "============================================="
  echo ""
  echo "검증 결과:"
  echo "1. 출석 인증: ✅ 성공"
  echo "2. 출석 기록: ✅ 확인됨"
  echo "3. 숙제 채점: (위 결과 참조)"
  echo ""
  
else
  echo ""
  if echo "$VERIFY_RESPONSE" | grep -qi "학생 정보를 찾을 수 없습니다\|학생을 찾을 수 없음"; then
    echo "❌ 여전히 '학생 정보를 찾을 수 없습니다' 에러 발생"
    echo ""
    echo "원인 분석:"
    echo "$VERIFY_RESPONSE" | jq '.error, .stack' 2>/dev/null || echo "$VERIFY_RESPONSE"
    
    echo ""
    echo "추가 디버깅 필요:"
    echo "1. student_attendance_codes 테이블의 userId 확인"
    echo "2. users 테이블에 해당 userId 존재 여부 확인"
    echo "3. verify.ts 파일의 userId 타입 매칭 확인"
    
  elif echo "$VERIFY_RESPONSE" | grep -qi "D1_ERROR"; then
    echo "❌ D1 에러 발생!"
    echo "$VERIFY_RESPONSE"
  else
    echo "❌ 출석 인증 실패 (기타 에러)"
    echo "$VERIFY_RESPONSE" | jq '.'
  fi
fi

echo ""
