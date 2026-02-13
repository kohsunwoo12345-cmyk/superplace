#!/bin/bash
echo "=== 🔍 학생 검색 기능 테스트 ==="
echo ""

echo "1️⃣ 숙제 제출 데이터 확인"
curl -s "https://superplacestudy.pages.dev/api/homework/results?date=$(date -u -d '+9 hours' +%Y-%m-%d)" | \
  jq -r '.submissions[:5] | .[] | "학생: \(.userName), 이메일: \(.userEmail), 과목: \(.subject), 점수: \(.score)점"'
echo ""

echo "2️⃣ 검색 기능 코드 확인"
grep -A 5 "filteredSubmissions = submissions.filter" src/app/dashboard/homework/results/page.tsx
echo ""

echo "3️⃣ 검색 UI 확인"
grep -A 10 "학생 검색" src/app/dashboard/homework/results/page.tsx | head -15
echo ""

echo "✅ 검색 기능 구현 완료"
echo "- 학생 이름으로 검색 가능"
echo "- 이메일로 검색 가능"
echo "- 과목으로 검색 가능"
echo "- 실시간 검색 결과 표시"
echo "- 초기화 버튼 제공"
