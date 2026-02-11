#!/bin/bash
echo "=== 🔍 이미지 로딩 흐름 테스트 ==="
echo ""
echo "1️⃣ 제출 카드 클릭 시 handleViewSubmission 함수가 호출되는가?"
echo "📍 파일: src/app/dashboard/homework/results/page.tsx"
grep -n "handleViewSubmission\|onClick.*submission\|상세 보기" src/app/dashboard/homework/results/page.tsx | head -20
echo ""
echo "2️⃣ handleViewSubmission 함수에서 이미지 API를 호출하는가?"
grep -A 15 "const handleViewSubmission" src/app/dashboard/homework/results/page.tsx | head -20
echo ""
echo "3️⃣ 제출 카드에 '상세 보기' 버튼이 있는가?"
grep -B 5 -A 5 "상세 보기" src/app/dashboard/homework/results/page.tsx | head -30
