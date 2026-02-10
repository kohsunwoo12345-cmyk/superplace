#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🎓 출석일 표시 완료 테스트"
echo "==========================="
echo ""

# 90초 대기
echo "⏳ 배포 대기 중 (90초)..."
sleep 90

echo ""
echo "1️⃣ 테스트 출석 데이터 생성"
echo "============================"
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/create-test-attendance")
echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"

SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success' 2>/dev/null)
TOTAL_RECORDS=$(echo "$CREATE_RESPONSE" | jq -r '.totalAttendanceRecords' 2>/dev/null)

echo ""
echo "📊 결과:"
echo "  - 성공: $SUCCESS"
echo "  - 생성된 출석 데이터: $TOTAL_RECORDS개"

echo ""
echo "2️⃣ 학생 통계 확인 (userId=129)"
echo "================================"
sleep 2
STATS_RESPONSE=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=129&academyId=1.0")
echo "$STATS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATS_RESPONSE"

ATTENDANCE_DAYS=$(echo "$STATS_RESPONSE" | jq -r '.attendanceDays' 2>/dev/null)

echo ""
echo "📊 출석일 확인:"
echo "  - 출석일: ${ATTENDANCE_DAYS}일"

echo ""
echo "3️⃣ 결과 판정"
echo "=============="
if [ "$ATTENDANCE_DAYS" != "0" ] && [ "$ATTENDANCE_DAYS" != "null" ]; then
  echo "✅ 성공! 출석일이 정상적으로 표시됩니다: ${ATTENDANCE_DAYS}일"
else
  echo "❌ 실패: 출석일이 여전히 0일입니다."
fi

echo ""
echo "🌐 UI 확인:"
echo "   ${BASE_URL}/dashboard"
echo ""
echo "📋 확인 사항:"
echo "   1) 출석일이 0일이 아닌 실제 숫자로 표시되는가?"
echo "   2) 학생별로 다른 출석일이 표시되는가?"

