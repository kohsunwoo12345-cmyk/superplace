#!/bin/bash

echo "=========================================="
echo "🔍 출석 통계 UI 테스트"
echo "=========================================="
echo ""

BASE_URL="https://superplacestudy.pages.dev"
STUDENT_ID="student-1772865101424-12ldfjns29zg"

echo "1️⃣ 학생 출석 통계 (role=STUDENT 포함)..."
STUDENT_ATTENDANCE=$(curl -s "${BASE_URL}/api/attendance/statistics?userId=${STUDENT_ID}&role=STUDENT")
echo "$STUDENT_ATTENDANCE" | jq '{
  success: .success,
  role: .role,
  attendanceDays: .attendanceDays,
  calendarDates: (.calendar | keys)
}'
echo ""

echo "2️⃣ 학생 캘린더 데이터..."
echo "$STUDENT_ATTENDANCE" | jq -r '.calendar | to_entries[] | "   \(.key): \(.value)"'
echo ""

echo "3️⃣ 관리자 출석 통계 (academyId=1)..."
ADMIN_ATTENDANCE=$(curl -s "${BASE_URL}/api/attendance/statistics?userId=admin-test&academyId=1")
echo "$ADMIN_ATTENDANCE" | jq '{
  success: .success,
  totalStudents: .statistics.totalStudents,
  monthAttendance: .statistics.monthAttendance,
  recordsCount: (.records | length)
}'
echo ""

echo "4️⃣ 최근 출석 레코드 (5개)..."
echo "$ADMIN_ATTENDANCE" | jq -r '.records[:5][] | "   \(.verifiedAt) - \(.userName): \(.status)"'
echo ""

echo "✅ 테스트 완료!"
echo ""
echo "📝 UI 확인 링크:"
echo "   학생: ${BASE_URL}/dashboard/attendance-statistics/"
echo "   관리자: ${BASE_URL}/dashboard/attendance-statistics/"
echo ""
