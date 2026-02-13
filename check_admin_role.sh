#!/bin/bash
echo "=== 🔍 admin@superplace.com 계정 role 확인 ==="
echo ""

echo "1️⃣ 데이터베이스에서 admin 계정 조회"
# Cloudflare D1 API를 통해 확인하거나, 로그인 API로 확인

echo "2️⃣ 로그인 API에서 role 매핑 확인"
grep -A 30 "userRole = user.role" functions/api/auth/login.ts

echo ""
echo "3️⃣ AI 봇 할당 페이지 접근 권한 확인"
grep -A 10 "allowedRoles" src/app/dashboard/admin/ai-bots/assign/page.tsx | head -12

echo ""
echo "4️⃣ 로그인 후 localStorage에 저장되는 role 값 확인 필요"
echo "브라우저 콘솔에서 확인:"
echo "  localStorage.getItem('user')"
echo "  JSON.parse(localStorage.getItem('user')).role"
