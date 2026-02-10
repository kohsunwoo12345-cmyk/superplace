#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "================================"
echo "🔍 실제 출석 체크인 시스템 테스트"
echo "================================"
echo ""

echo "1️⃣ 고선우 학생의 출석 코드 확인"
echo "----------------------------"
students=$(curl -s "${BASE_URL}/api/students?academyId=1&role=TEACHER&userId=1")
gosunwoo=$(echo "$students" | jq '.students[] | select(.id == 157)')
echo "$gosunwoo" | jq '{id, name, phone, email, academyId}'
echo ""

echo "2️⃣ 출석 코드 조회"
echo "----------------------------"
codes=$(curl -s "${BASE_URL}/api/attendance/code?role=TEACHER&userId=1&academyId=1")
echo "$codes" | jq '.codes[] | {id, code, className, academyId, isActive, createdBy}'
echo ""
echo "활성화된 출석 코드:"
active_code=$(echo "$codes" | jq -r '.codes[] | select(.isActive == 1) | .code' | head -1)
echo "코드: $active_code"
echo ""

if [ -z "$active_code" ]; then
  echo "⚠️  활성화된 출석 코드가 없습니다!"
  echo "   선생님이 먼저 출석 코드를 생성해야 합니다."
  echo ""
  echo "📝 출석 코드 생성 방법:"
  echo "   1. 선생님으로 로그인"
  echo "   2. 출석 관리 페이지로 이동"
  echo "   3. 출석 코드 생성 버튼 클릭"
  exit 1
fi

echo "3️⃣ 고선우 학생의 현재 출석 상태 확인"
echo "----------------------------"
current_attendance=$(curl -s "${BASE_URL}/api/admin/check-user-attendance?userId=157")
echo "$current_attendance" | jq '{
  userId,
  thisMonth: .stats.thisMonth,
  dateList
}'
current_days=$(echo "$current_attendance" | jq -r '.stats.thisMonth.distinctDays')
echo ""
echo "현재 출석일: ${current_days}일"
echo ""

echo "4️⃣ 실제 출석 체크인 시도"
echo "----------------------------"
echo "출석 코드: $active_code"
checkin_result=$(curl -s -X POST "${BASE_URL}/api/attendance/checkin" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$active_code\", \"userId\": 157}")
echo "$checkin_result" | jq '.'
success=$(echo "$checkin_result" | jq -r '.success')
echo ""

if [ "$success" = "true" ]; then
  echo "✅ 출석 체크인 성공!"
else
  error=$(echo "$checkin_result" | jq -r '.error')
  echo "❌ 출석 체크인 실패: $error"
  
  if [ "$error" = "Already checked in today" ]; then
    echo ""
    echo "ℹ️  이미 오늘 출석했습니다."
    echo "   기존 출석 기록:"
    echo "$checkin_result" | jq '.record'
  fi
fi
echo ""

echo "5️⃣ 출석 후 상태 확인"
echo "----------------------------"
sleep 2
after_attendance=$(curl -s "${BASE_URL}/api/admin/check-user-attendance?userId=157")
echo "$after_attendance" | jq '{
  userId,
  thisMonth: .stats.thisMonth,
  dateList
}'
after_days=$(echo "$after_attendance" | jq -r '.stats.thisMonth.distinctDays')
echo ""
echo "출석 후 출석일: ${after_days}일"
echo ""

echo "6️⃣ 대시보드 API 응답 확인"
echo "----------------------------"
dashboard=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=157&academyId=1.0")
echo "$dashboard" | jq '{
  attendanceDays,
  studyHours,
  completedHomework,
  averageScore,
  academyName
}'
dashboard_days=$(echo "$dashboard" | jq -r '.attendanceDays')
dashboard_hours=$(echo "$dashboard" | jq -r '.studyHours')
echo ""

echo "================================"
echo "📊 결과 비교"
echo "================================"
echo ""
echo "출석 전: ${current_days}일"
echo "출석 후: ${after_days}일"
echo "대시보드: ${dashboard_days}일 / ${dashboard_hours}시간"
echo ""

if [ "$after_days" -gt "$current_days" ]; then
  echo "✅ 출석이 정상적으로 기록되었습니다!"
  echo "   출석일이 증가했습니다: ${current_days}일 → ${after_days}일"
else
  echo "⚠️  출석일이 증가하지 않았습니다."
  echo ""
  echo "🔍 가능한 원인:"
  echo "  1. 이미 오늘 출석한 상태 (중복 체크인 방지)"
  echo "  2. 출석 코드가 다른 학생용"
  echo "  3. 출석 기록은 성공했지만 대시보드 API에서 조회 안 됨"
fi
echo ""

echo "🔗 대시보드 확인:"
echo "  ${BASE_URL}/dashboard"
