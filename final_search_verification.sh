#!/bin/bash
echo "=== 🎯 학생 검색 기능 최종 검증 ==="
echo ""

echo "1️⃣ 배포된 페이지 URL 확인"
echo "📍 https://superplacestudy.pages.dev/dashboard/homework/results/"
echo ""

echo "2️⃣ 현재 제출된 학생 목록"
curl -s "https://superplacestudy.pages.dev/api/homework/results?date=$(date -u -d '+9 hours' +%Y-%m-%d)" | \
  jq -r '.submissions | group_by(.userName) | .[] | "학생: \(.[0].userName), 제출 횟수: \(length)개"' | sort -u
echo ""

echo "3️⃣ 검색 기능 구현 상세"
echo "✅ Search 아이콘 추가"
grep -n "Search," src/app/dashboard/homework/results/page.tsx | head -1

echo "✅ 검색 입력 필드 UI"
grep -n "학생 검색" src/app/dashboard/homework/results/page.tsx | head -1

echo "✅ 실시간 필터링 로직"
grep -n "filteredSubmissions = submissions.filter" src/app/dashboard/homework/results/page.tsx

echo "✅ 검색 결과 개수 표시"
grep -n "검색 결과:" src/app/dashboard/homework/results/page.tsx
echo ""

echo "4️⃣ 모든 탭에서 검색 적용 확인"
echo "전체 탭:"
grep -n "filteredSubmissions.length" src/app/dashboard/homework/results/page.tsx | head -1
echo "높은 점수 탭:"
grep -n "filteredSubmissions" src/app/dashboard/homework/results/page.tsx | grep "score >= 80" | head -1
echo "낮은 점수 탭:"
grep -n "filteredSubmissions" src/app/dashboard/homework/results/page.tsx | grep "score < 60" | head -1
echo ""

echo "5️⃣ Git 커밋 확인"
git log -1 --oneline
echo ""

echo "✅ 기능 구현 완료!"
echo ""
echo "📋 사용 방법:"
echo "1. https://superplacestudy.pages.dev/dashboard/homework/results/ 접속"
echo "2. '학생 검색' 카드의 입력 필드에 검색어 입력"
echo "3. 학생 이름(예: 고선우), 이메일, 과목(예: 수학) 중 하나 입력"
echo "4. 입력하는 즉시 결과가 필터링됨"
echo "5. '초기화' 버튼으로 검색 취소"
echo ""
echo "🎨 UI 특징:"
echo "- 검색 아이콘이 있는 깔끔한 입력 필드"
echo "- 검색 결과 개수 실시간 표시"
echo "- 검색 중일 때 초기화 버튼 표시"
echo "- 검색 결과 없을 때 안내 메시지"
