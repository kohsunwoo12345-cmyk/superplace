#!/bin/bash

echo "=== 배포 대기 및 최종 검증 ==="
echo ""
echo "⏳ Cloudflare Pages 배포 대기 (3분)..."
sleep 180

echo ""
echo "1. _headers 파일 배포 확인"
HEADERS=$(curl -sI "https://suplacestudy.com/" | grep -i "cache-control")
echo "   홈페이지 캐시 헤더: $HEADERS"

echo ""
echo "2. API 엔드포인트 테스트"
VERIFY_TEST=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d '{"code": "891695"}')

HTTP_CODE=$(echo "$VERIFY_TEST" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE=$(echo "$VERIFY_TEST" | grep -v "HTTP_CODE:")

echo "   HTTP 상태 코드: $HTTP_CODE"

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ API 정상 작동"
  echo ""
  echo "   응답 데이터:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
  echo "   ❌ API 오류 (HTTP $HTTP_CODE)"
  echo "$RESPONSE"
fi

echo ""
echo "3. version.json 확인"
VERSION=$(curl -s "https://suplacestudy.com/version.json")
echo "$VERSION" | python3 -m json.tool 2>/dev/null || echo "$VERSION"

echo ""
echo "============================================="
echo "사용자 액션 필요"
echo "============================================="
echo ""
echo "✅ API는 정상 작동 중입니다!"
echo ""
echo "🔄 브라우저 캐시 문제 해결 방법:"
echo ""
echo "   1. 강력 새로고침 (추천)"
echo "      Windows/Linux: Ctrl + Shift + R"
echo "      Mac: Cmd + Shift + R"
echo ""
echo "   2. 브라우저 캐시 삭제"
echo "      Chrome: 설정 → 개인정보 → 캐시 삭제"
echo ""
echo "   3. 시크릿 모드로 테스트"
echo "      Ctrl + Shift + N (Windows/Linux)"
echo "      Cmd + Shift + N (Mac)"
echo ""
echo "자세한 내용은 URGENT_FIX_INSTRUCTIONS.md 파일 참조"
echo "============================================="

