#!/bin/bash

# 학생별 출석 데이터 분리 문제 진단 스크립트
BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "================================"
echo "학생별 출석 데이터 분리 진단"
echo "================================"
echo ""

echo "1️⃣ 전체 출석 데이터 확인"
echo "-------------------------"
curl -s "${BASE_URL}/api/admin/check-attendance-data" | jq '.'
echo ""

echo "2️⃣ 각 학생별 출석일 API 조회"
echo "-------------------------"
for userId in 129 130 131 157; do
  echo "학생 ID: $userId"
  response=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=${userId}&academyId=1.0")
  attendanceDays=$(echo "$response" | jq -r '.attendanceDays')
  echo "  출석일: ${attendanceDays}일"
  echo ""
done

echo "3️⃣ 특정 학생의 실제 출석 기록 조회"
echo "-------------------------"
echo "학생 ID 129의 출석 기록:"
curl -s "${BASE_URL}/api/admin/check-user-attendance?userId=129" | jq '.'
echo ""

echo "학생 ID 157의 출석 기록:"
curl -s "${BASE_URL}/api/admin/check-user-attendance?userId=157" | jq '.'
echo ""

echo "4️⃣ 문제 확인 포인트"
echo "-------------------------"
echo "✅ 확인할 사항:"
echo "  1. 각 학생의 출석 기록 개수가 API 응답과 일치하는가?"
echo "  2. 학생별로 출석 데이터가 정확히 분리되어 있는가?"
echo "  3. userId 필터링이 제대로 작동하는가?"
echo "  4. 중복 데이터나 타입 불일치 문제가 있는가?"
echo ""

echo "================================"
echo "진단 완료"
echo "================================"
