#!/bin/bash

echo "=== AI 봇 쇼핑몰 메뉴 검증 ==="
echo ""

echo "1. Sidebar.tsx 파일 존재 확인:"
if [ -f "src/components/dashboard/Sidebar.tsx" ]; then
    echo "✅ 파일 존재"
else
    echo "❌ 파일 없음"
    exit 1
fi

echo ""
echo "2. ShoppingCart 아이콘 임포트 확인:"
if grep -q "ShoppingCart" src/components/dashboard/Sidebar.tsx; then
    echo "✅ ShoppingCart 임포트됨"
else
    echo "❌ ShoppingCart 임포트 안됨"
fi

echo ""
echo "3. Zap 아이콘 임포트 확인:"
if grep -q "Zap" src/components/dashboard/Sidebar.tsx; then
    echo "✅ Zap 임포트됨"
else
    echo "❌ Zap 임포트 안됨"
fi

echo ""
echo "4. SUPER_ADMIN 메뉴에 쇼핑몰 확인:"
if grep -A 1 "SUPER_ADMIN: \[" src/components/dashboard/Sidebar.tsx | grep -q "🛒 AI 봇 쇼핑몰"; then
    echo "✅ SUPER_ADMIN 메뉴에 추가됨"
else
    echo "❌ SUPER_ADMIN 메뉴에 없음"
fi

echo ""
echo "5. ADMIN 메뉴에 쇼핑몰 확인:"
if grep -A 1 "ADMIN: \[" src/components/dashboard/Sidebar.tsx | grep -q "🛒 AI 봇 쇼핑몰"; then
    echo "✅ ADMIN 메뉴에 추가됨"
else
    echo "❌ ADMIN 메뉴에 없음"
fi

echo ""
echo "6. DIRECTOR 메뉴에 쇼핑몰 확인:"
if grep -A 1 "DIRECTOR: \[" src/components/dashboard/Sidebar.tsx | grep -q "🛒 AI 봇 쇼핑몰"; then
    echo "✅ DIRECTOR 메뉴에 추가됨"
else
    echo "❌ DIRECTOR 메뉴에 없음"
fi

echo ""
echo "7. featured 플래그 확인:"
if grep "🛒 AI 봇 쇼핑몰" src/components/dashboard/Sidebar.tsx | grep -q "featured: true"; then
    echo "✅ featured 플래그 설정됨"
else
    echo "❌ featured 플래그 없음"
fi

echo ""
echo "8. /store 링크 확인:"
if grep "🛒 AI 봇 쇼핑몰" src/components/dashboard/Sidebar.tsx | grep -q 'href: "/store"'; then
    echo "✅ /store 링크 설정됨"
else
    echo "❌ /store 링크 없음"
fi

echo ""
echo "9. 애니메이션 CSS 확인:"
if grep -q "animate-pulse\|animate-bounce" src/components/dashboard/Sidebar.tsx; then
    echo "✅ 애니메이션 CSS 있음"
else
    echo "❌ 애니메이션 CSS 없음"
fi

echo ""
echo "10. 그라디언트 스타일 확인:"
if grep -q "from-blue-500 to-purple-600" src/components/dashboard/Sidebar.tsx; then
    echo "✅ 그라디언트 스타일 있음"
else
    echo "❌ 그라디언트 스타일 없음"
fi

echo ""
echo "=== 메뉴 내용 미리보기 ==="
echo ""
echo "SUPER_ADMIN 메뉴 (처음 3줄):"
grep -A 2 "SUPER_ADMIN: \[" src/components/dashboard/Sidebar.tsx | head -3
echo ""
echo "ADMIN 메뉴 (처음 3줄):"
grep -A 2 "ADMIN: \[" src/components/dashboard/Sidebar.tsx | head -3
echo ""
echo "DIRECTOR 메뉴 (처음 3줄):"
grep -A 2 "DIRECTOR: \[" src/components/dashboard/Sidebar.tsx | head -3

echo ""
echo "=== 최근 커밋 ==="
git log --oneline -3

echo ""
echo "=== 검증 완료 ==="
