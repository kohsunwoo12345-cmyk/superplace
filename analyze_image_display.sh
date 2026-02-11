#!/bin/bash
echo "=== 1️⃣ 숙제 결과 페이지에서 이미지 표시 로직 분석 ==="
echo ""
echo "📍 파일: src/app/dashboard/homework/results/page.tsx"
echo ""
grep -n "submissionImages\|imageUrl\|사진\|이미지" src/app/dashboard/homework/results/page.tsx | head -30
echo ""
echo "=== 2️⃣ 이미지 API 확인 ==="
echo ""
echo "📍 파일: functions/api/homework/images.ts"
ls -lh functions/api/homework/images.ts 2>/dev/null || echo "파일이 존재하지 않습니다"
echo ""
echo "=== 3️⃣ 실제 이미지 데이터 확인 ==="
echo ""
curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=homework-1770837819995-qeqbi7btx" | head -c 500
