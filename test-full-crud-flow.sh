#!/bin/bash

echo "============================================="
echo "전체 CRUD 흐름 테스트 (3분 대기 후)"
echo "============================================="

echo ""
echo "⏳ Cloudflare Pages 배포 대기 중 (180초)..."
sleep 180

echo ""
echo "=== 1단계: 학생 생성 테스트 ==="
TIMESTAMP=$(date +%s)
STUDENT_EMAIL="test-student-${TIMESTAMP}@test.com"
STUDENT_NAME="테스트학생${TIMESTAMP}"
STUDENT_PASSWORD="testpass123"

echo "📝 학생 생성 시도: $STUDENT_NAME ($STUDENT_EMAIL)"
STUDENT_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$STUDENT_NAME\",
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"$STUDENT_PASSWORD\",
    \"role\": \"STUDENT\",
    \"phone\": \"010-1234-5678\",
    \"academyId\": \"1\"
  }")

echo "$STUDENT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STUDENT_RESPONSE"

# 학생 ID 추출
STUDENT_ID=$(echo "$STUDENT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('userId', ''))" 2>/dev/null)

if [ -z "$STUDENT_ID" ]; then
  echo "❌ 학생 생성 실패"
else
  echo "✅ 학생 생성 성공: ID=$STUDENT_ID"
  
  echo ""
  echo "=== 2단계: 출석 코드 확인 ==="
  CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/attendance/code?userId=$STUDENT_ID")
  echo "$CODE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CODE_RESPONSE"
  
  ATTENDANCE_CODE=$(echo "$CODE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('code', ''))" 2>/dev/null)
  
  if [ -z "$ATTENDANCE_CODE" ] || [ "$ATTENDANCE_CODE" = "null" ]; then
    echo "❌ 출석 코드 없음"
  else
    echo "✅ 출석 코드: $ATTENDANCE_CODE"
    
    echo ""
    echo "=== 3단계: 출석 인증 테스트 ==="
    VERIFY_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
      -H "Content-Type: application/json" \
      -d "{\"code\": \"$ATTENDANCE_CODE\"}")
    
    echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
    
    SUCCESS=$(echo "$VERIFY_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('success', False))" 2>/dev/null)
    
    if [ "$SUCCESS" = "True" ]; then
      echo "✅ 출석 인증 성공"
      
      echo ""
      echo "=== 4단계: 출석 기록 확인 ==="
      STATS_RESPONSE=$(curl -s "https://suplacestudy.com/api/attendance/statistics")
      echo "$STATS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"총 출석일: {data.get('attendanceDays', 0)}\")" 2>/dev/null || echo "$STATS_RESPONSE"
    else
      echo "❌ 출석 인증 실패"
    fi
  fi
fi

echo ""
echo "=== 5단계: 교사 생성 테스트 ==="
TEACHER_EMAIL="test-teacher-${TIMESTAMP}@test.com"
TEACHER_NAME="테스트교사${TIMESTAMP}"

echo "📝 교사 생성 시도: $TEACHER_NAME ($TEACHER_EMAIL)"
TEACHER_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TEACHER_NAME\",
    \"email\": \"$TEACHER_EMAIL\",
    \"password\": \"$STUDENT_PASSWORD\",
    \"role\": \"TEACHER\",
    \"phone\": \"010-9876-5432\",
    \"academyId\": \"1\"
  }")

echo "$TEACHER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TEACHER_RESPONSE"

TEACHER_ID=$(echo "$TEACHER_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('userId', ''))" 2>/dev/null)

if [ -z "$TEACHER_ID" ]; then
  echo "❌ 교사 생성 실패"
else
  echo "✅ 교사 생성 성공: ID=$TEACHER_ID"
fi

echo ""
echo "============================================="
echo "테스트 요약"
echo "============================================="
echo "1. 학생 생성: $([ -n "$STUDENT_ID" ] && echo '✅ 성공' || echo '❌ 실패')"
echo "2. 출석 코드: $([ -n "$ATTENDANCE_CODE" ] && [ "$ATTENDANCE_CODE" != "null" ] && echo '✅ 생성됨' || echo '❌ 없음')"
echo "3. 출석 인증: $([ "$SUCCESS" = "True" ] && echo '✅ 성공' || echo '❌ 실패')"
echo "4. 교사 생성: $([ -n "$TEACHER_ID" ] && echo '✅ 성공' || echo '❌ 실패')"
echo "============================================="

