#!/bin/bash

echo "========================================="
echo "📄 Kakao 페이지 테스트"
echo "========================================="
echo ""

BASE_URL="https://superplacestudy.pages.dev"

declare -a PAGES=(
    "/dashboard/kakao-channel/"
    "/dashboard/kakao-channel/register/"
    "/dashboard/kakao-channel/send/"
    "/dashboard/kakao-alimtalk/templates/"
)

for PAGE in "${PAGES[@]}"; do
    URL="${BASE_URL}${PAGE}"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
    
    if [ "$STATUS" = "200" ]; then
        echo "✅ $PAGE - $STATUS"
    else
        echo "❌ $PAGE - $STATUS"
    fi
done

echo ""
echo "========================================="
echo "✅ 페이지 테스트 완료"
echo "========================================="
