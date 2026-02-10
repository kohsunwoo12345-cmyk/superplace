#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "================================"
echo "🔍 고선우 학생 찾기"
echo "================================"
echo ""

echo "1️⃣ 이름으로 학생 검색"
echo "----------------------------"
students=$(curl -s "${BASE_URL}/api/students?academyId=1&role=TEACHER&userId=1")
echo "$students" | jq '.students[] | select(.name | contains("고선우"))'
echo ""

echo "2️⃣ 전화번호로 학생 검색"
echo "----------------------------"
echo "$students" | jq '.students[] | select(.phone | contains("1234-1234"))'
echo ""

echo "3️⃣ 모든 학생 목록 (이름과 전화번호)"
echo "----------------------------"
echo "$students" | jq -r '.students[] | "\(.id) | \(.name) | \(.phone)"' | head -20
echo ""

echo "4️⃣ ID 157 학생 확인 (이전에 5일 출석으로 나온 학생)"
echo "----------------------------"
echo "$students" | jq '.students[] | select(.id == 157)'
echo ""

# ID 157 확인
attendance_157=$(curl -s "${BASE_URL}/api/admin/check-user-attendance?userId=157")
echo "📊 학생 ID 157 출석 정보:"
echo "$attendance_157" | jq '{userId, stats: .stats.thisMonth, dateList}'
echo ""

echo "================================"
echo "💡 힌트"
echo "================================"
echo "위의 목록에서 고선우 학생을 찾아주세요."
echo "학생 ID를 알려주시면 정확한 출석 데이터를 조회하겠습니다."
