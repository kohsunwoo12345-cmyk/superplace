#!/bin/bash

echo "============================================="
echo "실제 학생 출석 → 기록 → 채점 전체 플로우 테스트"
echo "============================================="
echo ""

# 실제 학생 데이터 확인
echo "=== 1단계: 실제 학생 데이터 확인 ==="
echo "📝 users 테이블에서 실제 학생(STUDENT 역할) 조회"

STUDENTS=$(curl -X GET "https://suplacestudy.com/api/admin/check-users-schema" -s | grep -o '"role":"STUDENT"' | wc -l)
echo "발견된 학생 수: $STUDENTS"

echo ""
echo "📝 샘플 학생 데이터 (처음 5명)"
curl -X GET "https://suplacestudy.com/api/admin/check-users-schema" -s | jq '.sampleData[] | select(.role == "STUDENT") | {id, name, email, role}' | head -30

echo ""
echo ""
echo "=== 2단계: 학생 출석 코드 확인 ==="
echo "📝 student_attendance_codes 테이블에서 활성 코드 조회"

# 임의 테스트 userId로 코드 생성 시도
TEST_USER_ID="1"
echo ""
echo "테스트: userId=$TEST_USER_ID 의 출석 코드 조회/생성"
CODE_RESPONSE=$(curl -X GET "https://suplacestudy.com/api/attendance/code?userId=$TEST_USER_ID" -s)
echo "$CODE_RESPONSE" | jq '.'

ATTENDANCE_CODE=$(echo "$CODE_RESPONSE" | jq -r '.code // empty')

if [ -n "$ATTENDANCE_CODE" ] && [ "$ATTENDANCE_CODE" != "null" ]; then
  echo ""
  echo "✅ 출석 코드 확인: $ATTENDANCE_CODE"
  
  echo ""
  echo "=== 3단계: 출석 코드로 출석 인증 시도 ==="
  echo "📝 코드 '$ATTENDANCE_CODE'로 출석 인증"
  
  VERIFY_RESPONSE=$(curl -X POST "https://suplacestudy.com/api/attendance/verify" \
    -H "Content-Type: application/json" \
    -d "{\"code\": \"$ATTENDANCE_CODE\"}" \
    -s)
  
  echo "$VERIFY_RESPONSE" | jq '.'
  
  # 에러 체크
  if echo "$VERIFY_RESPONSE" | grep -qi "D1_ERROR\|no such column"; then
    echo ""
    echo "❌ D1 에러 발생!"
  elif echo "$VERIFY_RESPONSE" | grep -qi "학생을 찾을 수 없습니다\|학생 정보를 찾을 수 없습니다"; then
    echo ""
    echo "❌ 학생 정보를 찾을 수 없다는 에러 발생!"
    echo "원인: userId=$TEST_USER_ID 가 users 테이블에 없거나 출석코드의 userId가 잘못됨"
  elif echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ 출석 인증 성공!"
    
    echo ""
    echo "=== 4단계: 출석 기록 확인 ==="
    echo "📝 attendance_records_v2 테이블에서 오늘 출석 기록 조회"
    
    # 출석 통계 API로 확인
    STATS_RESPONSE=$(curl -X GET "https://suplacestudy.com/api/attendance/statistics?userId=$TEST_USER_ID&role=STUDENT" -s)
    echo "$STATS_RESPONSE" | jq '.calendar' | head -20
    
    echo ""
    echo "✅ 출석 기록 확인 완료"
  else
    echo ""
    echo "⚠️ 알 수 없는 응답"
  fi
else
  echo ""
  echo "❌ 출석 코드를 찾을 수 없음"
  echo "이유: userId=$TEST_USER_ID 에 대한 활성 출석 코드가 없음"
fi

echo ""
echo ""
echo "============================================="
echo "실제 학생 계정으로 재테스트 필요"
echo "============================================="
echo ""
echo "다음 단계:"
echo "1. 실제 STUDENT 역할을 가진 사용자 ID 확인"
echo "2. 해당 사용자의 출석 코드 생성"
echo "3. 출석 코드로 인증 테스트"
echo ""
