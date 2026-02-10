#!/bin/bash

# 학생별 출석 데이터 분리 문제 완전 진단 스크립트
BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "================================"
echo "🔍 학생별 출석 데이터 분리 완전 진단"
echo "================================"
echo ""
echo "⏳ 배포 대기 중 (90초)..."
sleep 90
echo ""

echo "1️⃣ 전체 출석 데이터 조회"
echo "================================"
all_data=$(curl -s "${BASE_URL}/api/admin/check-attendance-data")
echo "$all_data" | jq '.'
echo ""

# 전체 데이터 분석
total_records=$(echo "$all_data" | jq -r '.totalRecords')
unique_users=$(echo "$all_data" | jq -r '.diagnostics.uniqueUsers')
echo "📊 요약:"
echo "  - 전체 출석 기록: ${total_records}개"
echo "  - 고유 학생 수: ${unique_users}명"
echo ""

echo "2️⃣ 학생별 통계 (데이터베이스)"
echo "================================"
echo "$all_data" | jq -r '.userStats[] | "학생 ID: \(.userId) → 총 \(.totalRecords)건, 고유 날짜 \(.distinctDays)일"'
echo ""

echo "3️⃣ 각 학생별 API 응답 확인"
echo "================================"
for userId in 129 130 131 157; do
  echo "👤 학생 ID: $userId"
  echo "----------------------------"
  
  # API 응답
  api_response=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=${userId}&academyId=1.0")
  api_days=$(echo "$api_response" | jq -r '.attendanceDays')
  
  # 실제 데이터
  user_data=$(curl -s "${BASE_URL}/api/admin/check-user-attendance?userId=${userId}")
  db_days=$(echo "$user_data" | jq -r '.stats.thisMonth.distinctDays')
  db_records=$(echo "$user_data" | jq -r '.stats.thisMonth.totalRecords')
  
  echo "  📱 API 응답 출석일: ${api_days}일"
  echo "  💾 DB 실제 데이터: ${db_records}건 (고유 ${db_days}일)"
  
  if [ "$api_days" != "$db_days" ]; then
    echo "  ⚠️  불일치 발견!"
  else
    echo "  ✅ 일치"
  fi
  
  echo ""
done

echo "4️⃣ 구체적 출석 기록 확인"
echo "================================"
echo "학생 ID 129의 출석 날짜 목록:"
curl -s "${BASE_URL}/api/admin/check-user-attendance?userId=129" | jq -r '.dateList[]'
echo ""

echo "학생 ID 157의 출석 날짜 목록:"
curl -s "${BASE_URL}/api/admin/check-user-attendance?userId=157" | jq -r '.dateList[]'
echo ""

echo "5️⃣ 문제 진단"
echo "================================"
echo "❓ 다음 사항을 확인하세요:"
echo ""
echo "1. API 응답 출석일과 DB 실제 데이터가 일치하는가?"
echo "   → 불일치 시 SQL 쿼리 문제 가능성"
echo ""
echo "2. 각 학생의 출석 날짜 목록이 겹치지 않는가?"
echo "   → 겹침 시 데이터가 공유되고 있음"
echo ""
echo "3. userId 타입이 일관되는가?"
echo "   → 타입 불일치 시 필터링 실패 가능성"
echo ""
echo "4. 실제로 1일 출석한 학생이 있다면 어느 학생인가?"
echo "   → 해당 학생의 API 응답을 확인"
echo ""

echo "================================"
echo "✅ 진단 완료"
echo "================================"
echo ""
echo "🔗 수동 확인 URL:"
echo "  - 전체 데이터: ${BASE_URL}/api/admin/check-attendance-data"
echo "  - 학생 129: ${BASE_URL}/api/admin/check-user-attendance?userId=129"
echo "  - 학생 130: ${BASE_URL}/api/admin/check-user-attendance?userId=130"
echo "  - 학생 131: ${BASE_URL}/api/admin/check-user-attendance?userId=131"
echo "  - 학생 157: ${BASE_URL}/api/admin/check-user-attendance?userId=157"
