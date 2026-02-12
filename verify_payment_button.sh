#!/bin/bash
echo "=== 🔍 결제 승인 버튼 확인 ==="
echo ""
echo "1️⃣ 소스 코드 확인"
grep -A 3 "결제 승인" src/app/dashboard/admin/page.tsx | head -8
echo ""
echo "2️⃣ 배포된 페이지 접근 테스트"
echo "URL: https://superplacestudy.pages.dev/dashboard/admin"
curl -s "https://superplacestudy.pages.dev/dashboard/admin" -I | head -5
echo ""
echo "3️⃣ Git 최신 커밋 확인"
git log --oneline -1
