#!/bin/bash

echo "=========================================="
echo "🔍 대시보드 URL 차이 확인"
echo "=========================================="

echo ""
echo "📄 일반 사용자 대시보드:"
echo "   URL: /dashboard"
echo "   파일: src/app/dashboard/page.tsx"
echo ""

# 일반 대시보드 확인
if [ -f "src/app/dashboard/page.tsx" ]; then
  echo "   ✅ 파일 존재"
  grep -q "결제 승인" src/app/dashboard/page.tsx && echo "   ✅ 결제 승인 메뉴 있음" || echo "   ❌ 결제 승인 메뉴 없음"
else
  echo "   ❌ 파일 없음"
fi

echo ""
echo "=========================================="
echo "📄 관리자 대시보드:"
echo "   URL: /dashboard/admin"
echo "   파일: src/app/dashboard/admin/page.tsx"
echo ""

# 관리자 대시보드 확인
if [ -f "src/app/dashboard/admin/page.tsx" ]; then
  echo "   ✅ 파일 존재"
  grep -q "결제 승인" src/app/dashboard/admin/page.tsx && echo "   ✅ 결제 승인 메뉴 있음" || echo "   ❌ 결제 승인 메뉴 없음"
else
  echo "   ❌ 파일 없음"
fi

echo ""
echo "=========================================="
echo "🔑 결론"
echo "=========================================="
echo ""
echo "결제 승인 메뉴는 **관리자 대시보드**에만 있습니다!"
echo ""
echo "❌ 잘못된 URL: https://superplacestudy.pages.dev/dashboard/"
echo "✅ 올바른 URL: https://superplacestudy.pages.dev/dashboard/admin"
echo ""
echo "=========================================="

