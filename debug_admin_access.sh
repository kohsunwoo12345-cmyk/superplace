#!/bin/bash
echo "=== 🔍 admin 계정 접근 권한 완전 디버깅 ==="
echo ""

echo "1️⃣ 관리자 메뉴에서 AI 봇 할당 링크 확인"
grep -n "ai-bots/assign\|AI.*봇.*할당" src/app/dashboard/admin/page.tsx | head -10

echo ""
echo "2️⃣ AI 봇 할당 페이지 경로 확인"
find src/app/dashboard/admin -name "page.tsx" -path "*ai-bots*" -o -name "page.tsx" -path "*assign*"

echo ""
echo "3️⃣ 실제 페이지 파일 위치"
ls -la src/app/dashboard/admin/ai-bots/assign/page.tsx 2>/dev/null || echo "❌ 파일이 없음!"

echo ""
echo "4️⃣ 접근 권한 체크 코드 확인"
grep -A 20 "useEffect" src/app/dashboard/admin/ai-bots/assign/page.tsx | grep -A 15 "storedUser"

echo ""
echo "5️⃣ localStorage에서 읽는 user role 확인"
echo "브라우저 콘솔에서 실행:"
echo "  const user = JSON.parse(localStorage.getItem('user'));"
echo "  console.log('User role:', user.role);"
echo "  console.log('User role uppercase:', (user.role || '').toUpperCase());"

echo ""
echo "6️⃣ 로그인 API에서 반환하는 role 확인"
grep -B 5 -A 10 "role: userRole" functions/api/auth/login.ts | head -20
