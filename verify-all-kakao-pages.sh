#!/bin/bash

echo "================================================"
echo "🎯 카카오 페이지 전체 검증 스크립트"
echo "================================================"
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="https://superplacestudy.pages.dev"

# 검증할 URL 목록
declare -a PAGES=(
    "/dashboard/kakao-channel/"
    "/dashboard/kakao-channel/register/"
    "/dashboard/kakao-channel/send/"
    "/dashboard/kakao-alimtalk/"
    "/dashboard/kakao-alimtalk/templates/"
)

echo "📋 검증할 페이지: ${#PAGES[@]}개"
echo ""

SUCCESS=0
FAILED=0

for PAGE in "${PAGES[@]}"; do
    URL="${BASE_URL}${PAGE}"
    echo -n "Testing: $PAGE ... "
    
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
    
    if [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✅ $STATUS${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ $STATUS${NC}"
        ((FAILED++))
    fi
done

echo ""
echo "================================================"
echo "📊 검증 결과"
echo "================================================"
echo -e "✅ 성공: ${GREEN}$SUCCESS${NC}개"
echo -e "❌ 실패: ${RED}$FAILED${NC}개"
echo ""

# API 엔드포인트 검증
echo "================================================"
echo "🔌 API 엔드포인트 검증"
echo "================================================"
echo ""

echo -n "Testing: /api/kakao/channels ... "
API_RESPONSE=$(curl -s "${BASE_URL}/api/kakao/channels?userId=test123")
if echo "$API_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ OK${NC}"
    echo "   Response: $API_RESPONSE"
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "   Response: $API_RESPONSE"
fi

echo ""
echo -n "Testing: /api/auth/session ... "
SESSION_RESPONSE=$(curl -s "${BASE_URL}/api/auth/session")
if echo "$SESSION_RESPONSE" | grep -q 'user'; then
    echo -e "${GREEN}✅ OK${NC}"
    echo "   Response: $SESSION_RESPONSE"
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "   Response: $SESSION_RESPONSE"
fi

echo ""
echo "================================================"
echo "🎉 최종 결과"
echo "================================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 카카오 페이지가 정상 작동합니다!${NC}"
    echo ""
    echo "배포 URL: $BASE_URL"
    echo "상태: PRODUCTION READY"
    exit 0
else
    echo -e "${RED}❌ $FAILED 개의 페이지에 문제가 있습니다.${NC}"
    exit 1
fi
