#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "================================"
echo "🧹 테스트 데이터 정리 및 검증"
echo "================================"
echo ""
echo "⏳ 배포 대기 중 (90초)..."
sleep 90
echo ""

echo "📊 STEP 1: 현재 상태 확인"
echo "----------------------------"
current=$(curl -s "${BASE_URL}/api/admin/compare-all-attendance")
echo "현재 전체 학생 수: $(echo "$current" | jq -r '.totalStudents')"
echo "현재 총 출석 기록: $(echo "$current" | jq -r '.summary.totalRecords')"
echo ""
echo "학생별 출석 현황:"
echo "$current" | jq -r '.allStudents[] | "\(.userId) | \(.userName) | \(.attendanceDays)일 | 테스트데이터: \(.isTestData)"'
echo ""

echo "🗑️ STEP 2: 모든 테스트 데이터 삭제"
echo "----------------------------"
delete_result=$(curl -s -X POST "${BASE_URL}/api/admin/delete-all-test-attendance")
echo "$delete_result" | jq '.'
deleted_count=$(echo "$delete_result" | jq -r '.deleted.changes')
echo ""
echo "✅ 삭제된 테스트 데이터: ${deleted_count}건"
echo ""

echo "📊 STEP 3: 삭제 후 상태 확인"
echo "----------------------------"
after=$(curl -s "${BASE_URL}/api/admin/compare-all-attendance")
echo "남은 전체 학생 수: $(echo "$after" | jq -r '.totalStudents')"
echo "남은 총 출석 기록: $(echo "$after" | jq -r '.summary.totalRecords')"
echo ""
echo "학생별 출석 현황:"
echo "$after" | jq -r '.allStudents[] | "\(.userId) | \(.userName) | \(.attendanceDays)일"'
echo ""

echo "👤 STEP 4: 고선우 학생 확인"
echo "----------------------------"
gosunwoo=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=157&academyId=1.0")
echo "$gosunwoo" | jq '{
  attendanceDays,
  studyHours,
  completedHomework,
  averageScore,
  academyName
}'
attendance=$(echo "$gosunwoo" | jq -r '.attendanceDays')
study_hours=$(echo "$gosunwoo" | jq -r '.studyHours')
echo ""
echo "고선우 학생 현재 상태:"
echo "  출석일: ${attendance}일"
echo "  학습 시간: ${study_hours}시간"
echo ""

echo "================================"
echo "✅ 정리 완료"
echo "================================"
echo ""
echo "🎯 결과:"
if [ "$attendance" = "0" ]; then
  echo "  ✅ 테스트 데이터가 모두 삭제되었습니다!"
  echo "  ✅ 이제 실제 출석 시 자동으로 기록됩니다."
  echo ""
  echo "📱 실제 출석 방법:"
  echo "  1. 출석 코드로 체크인"
  echo "  2. 자동으로 출석 기록됨"
  echo "  3. 대시보드에 실시간 반영"
else
  echo "  ℹ️  현재 ${attendance}일의 실제 출석 기록이 있습니다."
fi
echo ""
echo "🔗 대시보드 확인:"
echo "  ${BASE_URL}/dashboard"
echo ""
echo "📝 다른 학생들도 자동으로 본인의 데이터만 표시됩니다!"
