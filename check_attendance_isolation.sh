#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🔍 학생별 출석 데이터 분리 확인"
echo "================================="
echo ""

echo "1️⃣ 여러 학생의 출석 데이터 조회"
echo "================================="

# 학생 129
echo ""
echo "학생 129:"
RESPONSE_129=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=129&academyId=1.0")
ATTENDANCE_129=$(echo "$RESPONSE_129" | jq -r '.attendanceDays' 2>/dev/null)
echo "  출석일: ${ATTENDANCE_129}일"

# 학생 130
echo ""
echo "학생 130:"
RESPONSE_130=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=130&academyId=1.0")
ATTENDANCE_130=$(echo "$RESPONSE_130" | jq -r '.attendanceDays' 2>/dev/null)
echo "  출석일: ${ATTENDANCE_130}일"

# 학생 131
echo ""
echo "학생 131:"
RESPONSE_131=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=131&academyId=1.0")
ATTENDANCE_131=$(echo "$RESPONSE_131" | jq -r '.attendanceDays' 2>/dev/null)
echo "  출석일: ${ATTENDANCE_131}일"

# 학생 157
echo ""
echo "학생 157:"
RESPONSE_157=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=157&academyId=1.0")
ATTENDANCE_157=$(echo "$RESPONSE_157" | jq -r '.attendanceDays' 2>/dev/null)
echo "  출석일: ${ATTENDANCE_157}일"

echo ""
echo "2️⃣ 문제 진단"
echo "=============="

# 모든 학생이 같은 출석일을 가지고 있는지 확인
if [ "$ATTENDANCE_129" = "$ATTENDANCE_130" ] && [ "$ATTENDANCE_129" = "$ATTENDANCE_131" ] && [ "$ATTENDANCE_129" = "$ATTENDANCE_157" ]; then
  echo "❌ 문제 발견: 모든 학생이 동일한 출석일(${ATTENDANCE_129}일)을 가지고 있습니다!"
  echo ""
  echo "원인:"
  echo "  - SQL 쿼리에서 userId 필터가 제대로 작동하지 않음"
  echo "  - 모든 학생의 출석 데이터를 합산하고 있을 가능성"
  echo "  - userId 타입 불일치 (INTEGER vs TEXT)"
else
  echo "✅ 정상: 학생별로 다른 출석일을 가지고 있습니다."
  echo "  - 학생 129: ${ATTENDANCE_129}일"
  echo "  - 학생 130: ${ATTENDANCE_130}일"
  echo "  - 학생 131: ${ATTENDANCE_131}일"
  echo "  - 학생 157: ${ATTENDANCE_157}일"
fi

