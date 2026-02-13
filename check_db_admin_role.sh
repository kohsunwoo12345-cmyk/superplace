#!/bin/bash

echo "==================================================="
echo "🔍 관리자 계정 DB Role 확인 가이드"
echo "==================================================="

echo ""
echo "1️⃣ Cloudflare D1 데이터베이스에서 확인하는 방법"
echo "---------------------------------------------------"
echo "wrangler d1 execute superplace-academy --command=\"SELECT id, email, name, role FROM users WHERE email LIKE '%admin%' OR email LIKE '%superplace%';\""

echo ""
echo "2️⃣ 또는 Cloudflare Dashboard에서 확인"
echo "---------------------------------------------------"
echo "https://dash.cloudflare.com/"
echo "→ Workers & Pages"
echo "→ D1 Database"
echo "→ superplace-academy"
echo "→ Console 탭"
echo "→ 다음 쿼리 실행:"
echo ""
echo "SELECT id, email, name, role, createdAt"
echo "FROM users"
echo "WHERE email LIKE '%admin%' OR email LIKE '%superplace%';"

echo ""
echo "3️⃣ 가능한 Role 값들"
echo "---------------------------------------------------"
echo "✅ ADMIN           → AI 봇 할당 페이지 접근 가능"
echo "✅ SUPER_ADMIN     → AI 봇 할당 페이지 접근 가능"
echo "✅ DIRECTOR        → AI 봇 할당 페이지 접근 가능"
echo "✅ MEMBER          → AI 봇 할당 페이지 접근 가능"
echo "❌ TEACHER         → 접근 권한 없음"
echo "❌ STUDENT         → 접근 권한 없음"
echo "❌ admin (소문자)  → 정규화되어 ADMIN으로 변환됨 (접근 가능)"
echo "❌ null 또는 없음  → 접근 권한 없음"

echo ""
echo "4️⃣ Role이 잘못되어 있다면 수정 방법"
echo "---------------------------------------------------"
echo "wrangler d1 execute superplace-academy --command=\"UPDATE users SET role = 'ADMIN' WHERE email = 'admin@superplace.com';\""

echo ""
echo "5️⃣ 로그인 후 브라우저에서 확인"
echo "---------------------------------------------------"
echo "F12 → Console → 다음 명령어 실행:"
echo ""
echo "const user = JSON.parse(localStorage.getItem('user'));"
echo "console.log('User Role:', user.role);"
echo "console.log('Role Type:', typeof user.role);"
echo "console.log('Full User Data:', user);"

echo ""
echo "6️⃣ 현재 코드의 Role 체크 로직"
echo "---------------------------------------------------"
cat << 'LOGIC'
// AI 봇 할당 페이지 (src/app/dashboard/admin/ai-bots/assign/page.tsx)
const userRole = (userData.role || "").toString().toUpperCase().trim();
const allowedRoles = ["ADMIN", "SUPER_ADMIN", "DIRECTOR", "MEMBER"];

if (!allowedRoles.includes(userRole)) {
  alert(`접근 권한이 없습니다.
  
현재 역할: ${userData.role}
정규화된 역할: ${userRole}
허용된 역할: ${allowedRoles.join(", ")}

관리자 또는 학원 원장만 접근 가능합니다.`);
  router.push("/dashboard");
  return;
}
LOGIC

echo ""
echo "==================================================="
echo "✅ 다음 단계"
echo "==================================================="
echo "1. 위 방법으로 DB에서 admin 계정의 실제 role 값 확인"
echo "2. role 값이 null이거나 TEACHER/STUDENT면 UPDATE 쿼리로 수정"
echo "3. 브라우저에서 로그아웃 후 재로그인"
echo "4. localStorage.getItem('user')로 role 확인"
echo "5. AI 봇 할당 메뉴 클릭하여 테스트"
echo "6. F12 콘솔에서 디버그 로그 확인"

