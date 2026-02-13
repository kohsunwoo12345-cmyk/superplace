#!/bin/bash
echo "=== 🔧 admin 계정 접근 권한 문제 수정 ==="
echo ""

echo "1️⃣ 문제 원인"
echo "❌ 데이터베이스의 role이 소문자 'admin'일 수 있음"
echo "❌ 할당 페이지는 대문자 'ADMIN'만 체크"
echo "❌ 대소문자 불일치로 접근 거부"

echo ""
echo "2️⃣ 해결 방법"
echo "✅ role을 대문자로 변환하여 체크: toUpperCase()"
echo "✅ 허용된 역할 목록도 대문자로 통일"
echo "✅ 콘솔 로그 추가로 디버깅 가능"

echo ""
echo "3️⃣ 수정된 코드 확인"
grep -A 5 "toUpperCase()" src/app/dashboard/admin/ai-bots/assign/page.tsx | head -6

echo ""
echo "4️⃣ 허용된 역할"
echo "✅ ADMIN (대소문자 무관)"
echo "✅ SUPER_ADMIN (대소문자 무관)"
echo "✅ DIRECTOR (대소문자 무관)"
echo "✅ MEMBER (대소문자 무관)"

echo ""
echo "5️⃣ 콘솔 로그 확인"
echo "브라우저 개발자 도구(F12) → Console 탭에서:"
echo "  🔍 AI 봇 할당 페이지 접근 확인"
echo "  - originalRole: 원본 role 값"
echo "  - normalizedRole: 대문자로 변환된 값"
echo "  - hasAccess: 접근 권한 여부"

echo ""
echo "✅ 수정 완료!"
echo ""
echo "이제 다음 role 값들이 모두 접근 가능합니다:"
echo "  - admin → ADMIN ✅"
echo "  - Admin → ADMIN ✅"
echo "  - ADMIN → ADMIN ✅"
echo "  - super_admin → SUPER_ADMIN ✅"
echo "  - director → DIRECTOR ✅"
echo "  - member → MEMBER ✅"
