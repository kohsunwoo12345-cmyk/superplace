#!/bin/bash

echo "==================================================="
echo "🔍 AI 봇 할당 페이지 접근 권한 문제 완전 분석"
echo "==================================================="

echo ""
echo "1️⃣ 관리자 메뉴에서 AI 봇 할당 링크 확인"
echo "---------------------------------------------------"
grep -A 10 "AI.*봇.*할당\|AI Bot 할당" src/app/dashboard/admin/page.tsx | grep -E "onClick|href|router.push" | head -5

echo ""
echo "2️⃣ AI 봇 할당 페이지 파일 존재 확인"
echo "---------------------------------------------------"
ls -lh src/app/dashboard/admin/ai-bots/assign/page.tsx 2>&1

echo ""
echo "3️⃣ 현재 접근 권한 체크 로직 (최신 버전)"
echo "---------------------------------------------------"
grep -A 30 "localStorage.getItem.*user" src/app/dashboard/admin/ai-bots/assign/page.tsx | grep -A 25 "const userData" | head -30

echo ""
echo "4️⃣ allowedRoles 확인"
echo "---------------------------------------------------"
grep "allowedRoles" src/app/dashboard/admin/ai-bots/assign/page.tsx

echo ""
echo "5️⃣ 접근 권한 알림 메시지 확인"
echo "---------------------------------------------------"
grep -B 2 -A 2 "접근 권한이 없습니다" src/app/dashboard/admin/ai-bots/assign/page.tsx

echo ""
echo "6️⃣ 로그인 API에서 반환하는 role 확인"
echo "---------------------------------------------------"
grep -A 5 "userRole\|role:" functions/api/auth/login.ts | head -20

echo ""
echo "7️⃣ 브라우저에서 확인할 사항"
echo "---------------------------------------------------"
echo "✅ 로그인 후 브라우저 콘솔에서 실행:"
echo "   localStorage.getItem('user')"
echo ""
echo "✅ 예상 결과:"
echo '   {"id":1,"email":"admin@superplace.com","name":"관리자","role":"ADMIN",...}'
echo ""
echo "✅ 만약 role이 없거나 다른 값이면:"
echo "   - 로그아웃 후 다시 로그인"
echo "   - localStorage.clear() 실행 후 재로그인"
echo ""
echo "8️⃣ 가능한 원인들"
echo "---------------------------------------------------"
echo "A) localStorage에 user 데이터가 없음 → 재로그인 필요"
echo "B) user.role이 undefined → 로그인 API 문제"
echo "C) user.role이 'STUDENT', 'TEACHER' 등 → DB에서 role 수정 필요"
echo "D) 브라우저 캐시 문제 → 강력 새로고침(Ctrl+Shift+R)"
echo "E) 다른 페이지가 먼저 로드됨 → URL 직접 입력 테스트"

echo ""
echo "9️⃣ 즉시 테스트 방법"
echo "---------------------------------------------------"
echo "1. 브라우저 개발자 도구 열기 (F12)"
echo "2. Console 탭으로 이동"
echo "3. localStorage.getItem('user') 입력 후 Enter"
echo "4. role 값 확인"
echo "5. 관리자 메뉴 → AI 봇 할당 클릭"
echo "6. 콘솔에 출력되는 디버그 로그 확인:"
echo "   🔍 AI Bot 할당 페이지 접근 확인"
echo "   - originalRole: ?"
echo "   - roleType: ?"
echo "   - normalizedRole: ?"
echo "   - allowedRoles: [...]"
echo "   - hasAccess: true/false"

echo ""
echo "==================================================="
echo "✅ 분석 완료"
echo "==================================================="

