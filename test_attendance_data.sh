#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🔍 출석 데이터 확인"
echo "===================="
echo ""

echo "1️⃣ 학생 통계 API 호출 (userId=129)"
RESPONSE=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=129&academyId=1.0")
echo "응답:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "2️⃣ attendanceDays 확인"
ATTENDANCE_DAYS=$(echo "$RESPONSE" | jq -r '.attendanceDays' 2>/dev/null)
echo "출석일: ${ATTENDANCE_DAYS}일"

echo ""
echo "3️⃣ 문제 진단"
if [ "$ATTENDANCE_DAYS" = "0" ]; then
  echo "❌ 출석일이 0일입니다."
  echo ""
  echo "가능한 원인:"
  echo "  1) attendance_records 테이블에 데이터가 없음"
  echo "  2) userId 매칭 문제"
  echo "  3) checkInTime 날짜 형식 문제"
  echo ""
  echo "해결 방법:"
  echo "  - 실제 출석 체크인을 해보기"
  echo "  - DB에 테스트 데이터 삽입"
else
  echo "✅ 출석일이 정상적으로 표시됩니다: ${ATTENDANCE_DAYS}일"
fi

