#!/bin/bash

echo "======================================"
echo "실제 Solapi API 카테고리 테스트"
echo "======================================"
echo ""

echo "1️⃣  카테고리 API 호출 테스트..."
RESPONSE=$(curl -s -w "\n%{http_code}" https://superplacestudy.pages.dev/api/kakao/channel-categories)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP 상태 코드: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API 호출 성공!"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" = "400" ]; then
  echo "❌ API 호출 실패 (400 Bad Request)"
  echo "$BODY"
  echo ""
  echo "가능한 원인:"
  echo "1. SOLAPI_API_Secret이 설정되지 않았거나 잘못됨"
  echo "2. API 인증 실패"
  echo "3. Solapi API 엔드포인트 변경"
else
  echo "❌ 예상치 못한 오류 ($HTTP_CODE)"
  echo "$BODY"
fi

echo ""
echo "2️⃣  하드코딩된 카테고리 사용 여부..."
if grep -q "HARDCODED_CATEGORIES" src/app/dashboard/kakao-channel/register/page.tsx; then
  echo "✅ 하드코딩 카테고리 사용 중"
  echo "   → API 실패 시 fallback으로 작동"
else
  echo "❌ 하드코딩 카테고리 없음"
fi
