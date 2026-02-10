#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "================================"
echo "🔍 고선우 학생 출석 데이터 정밀 조사"
echo "================================"
echo ""

echo "1️⃣ 고선우 학생 정보 조회"
echo "----------------------------"
# 전화번호로 학생 조회
students=$(curl -s "${BASE_URL}/api/students?academyId=1&role=TEACHER&userId=1")
echo "$students" | jq '.students[] | select(.phone == "010-1234-1234")'
gosunwoo_id=$(echo "$students" | jq -r '.students[] | select(.phone == "010-1234-1234") | .id')

echo ""
echo "📱 전화번호: 010-1234-1234"
echo "👤 학생 ID: $gosunwoo_id"
echo ""

echo "2️⃣ 실제 출석 기록 조회 (상세)"
echo "----------------------------"
attendance_data=$(curl -s "${BASE_URL}/api/admin/check-user-attendance?userId=${gosunwoo_id}")
echo "$attendance_data" | jq '.'
echo ""

echo "3️⃣ 이번 달 출석 통계"
echo "----------------------------"
total_records=$(echo "$attendance_data" | jq -r '.stats.thisMonth.totalRecords')
distinct_days=$(echo "$attendance_data" | jq -r '.stats.thisMonth.distinctDays')
echo "  총 출석 기록 수: ${total_records}건"
echo "  고유 출석일 수: ${distinct_days}일"
echo ""

echo "4️⃣ 출석 날짜 목록"
echo "----------------------------"
echo "$attendance_data" | jq -r '.dateList[]'
echo ""

echo "5️⃣ API 응답 확인 (대시보드)"
echo "----------------------------"
stats=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=${gosunwoo_id}&academyId=1.0")
echo "$stats" | jq '.'
echo ""

api_attendance=$(echo "$stats" | jq -r '.attendanceDays')
api_study_hours=$(echo "$stats" | jq -r '.studyHours')

echo "📊 대시보드 API 응답:"
echo "  출석일: ${api_attendance}일"
echo "  학습 시간: ${api_study_hours}시간"
echo ""

echo "6️⃣ 실제 출석일 확인"
echo "----------------------------"
echo "❓ 고선우 학생님, 실제로 이번 달에 며칠 출석하셨나요?"
echo ""
echo "현재 시스템에 기록된 출석 날짜:"
echo "$attendance_data" | jq -r '.dateList[]' | while read date; do
  echo "  📅 $date"
done
echo ""

echo "7️⃣ 문제 진단"
echo "----------------------------"
if [ "$distinct_days" != "$api_attendance" ]; then
  echo "⚠️  데이터 불일치 발견!"
  echo "  DB 실제 출석일: ${distinct_days}일"
  echo "  API 응답: ${api_attendance}일"
else
  echo "✅ API와 DB 데이터 일치"
  echo ""
  if [ "$distinct_days" -gt 1 ]; then
    echo "⚠️  시스템에는 ${distinct_days}일의 출석 기록이 있습니다."
    echo "     이것이 테스트 데이터인지 확인이 필요합니다."
    echo ""
    echo "🔍 출석 기록이 테스트 데이터인지 확인:"
    is_test=$(echo "$attendance_data" | jq -r '.records[0].id' | grep -c "test")
    if [ "$is_test" -gt 0 ]; then
      echo "  ✅ 이 데이터는 테스트 데이터입니다."
      echo "     실제 출석 데이터를 삭제하고 재생성해야 합니다."
    else
      echo "  ℹ️  실제 출석 데이터입니다."
    fi
  fi
fi
echo ""

echo "================================"
echo "✅ 조사 완료"
echo "================================"
echo ""
echo "다음 정보를 확인해주세요:"
echo "1. 위의 출석 날짜들이 실제 출석한 날짜가 맞나요?"
echo "2. 실제로는 며칠 출석하셨나요?"
echo "3. 테스트 데이터를 삭제하고 실제 데이터만 남겨야 할까요?"
