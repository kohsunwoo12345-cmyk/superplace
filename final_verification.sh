#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "================================"
echo "🔍 최종 검증: 학생별 출석 데이터 분리"
echo "================================"
echo ""
echo "⏳ 배포 대기 중 (90초)..."
sleep 90
echo ""

echo "✅ 모든 학생의 출석일 비교 분석"
echo "================================"
curl -s "${BASE_URL}/api/admin/compare-all-attendance" | jq '.'
echo ""

echo "================================"
echo "📊 요약"
echo "================================"
response=$(curl -s "${BASE_URL}/api/admin/compare-all-attendance")

total=$(echo "$response" | jq -r '.totalStudents')
discrepancies=$(echo "$response" | jq -r '.summary.studentsWithDiscrepancies')
single_day=$(echo "$response" | jq -r '.summary.singleDayStudents')
five_day=$(echo "$response" | jq -r '.summary.fiveDayStudents')

echo "전체 학생 수: ${total}명"
echo "데이터 불일치: ${discrepancies}건"
echo "1일 출석 학생: ${single_day}명"
echo "5일 출석 학생: ${five_day}명"
echo ""

if [ "$discrepancies" = "0" ]; then
  echo "✅ 모든 학생의 데이터가 정확히 분리되어 있습니다!"
else
  echo "⚠️  불일치가 발견되었습니다. 상세 내용을 확인하세요."
fi
echo ""

echo "🔗 상세 확인 URL:"
echo "${BASE_URL}/api/admin/compare-all-attendance"
