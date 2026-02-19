#!/bin/bash

# 프로덕션 배포 검증 스크립트
# 2-3분 후 실행하세요

echo "🔍 프로덕션 배포 검증 중..."
echo ""

# 1. Login API 테스트 (잘못된 자격증명)
echo "1️⃣ Login API - 잘못된 자격증명 (401 기대)"
RESPONSE1=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST https://superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@test.com","password":"wrong"}')

HTTP_CODE1=$(echo "$RESPONSE1" | grep "HTTP_CODE:" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | grep -v "HTTP_CODE:")

echo "  Status: $HTTP_CODE1"
echo "  Body: $BODY1"

if [ "$HTTP_CODE1" = "401" ]; then
  echo "  ✅ Login API 정상 작동 (401 Unauthorized)"
else
  echo "  ❌ Login API 오류 (예상: 401, 실제: $HTTP_CODE1)"
fi
echo ""

# 2. Login API 테스트 (유효한 자격증명)
echo "2️⃣ Login API - 유효한 자격증명 (200 기대)"
RESPONSE2=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST https://superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.com","password":"admin1234"}')

HTTP_CODE2=$(echo "$RESPONSE2" | grep "HTTP_CODE:" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | grep -v "HTTP_CODE:")

echo "  Status: $HTTP_CODE2"
echo "  Body: ${BODY2:0:100}..."

if [ "$HTTP_CODE2" = "200" ]; then
  echo "  ✅ Login 성공! (200 OK)"
else
  echo "  ❌ Login 실패 (예상: 200, 실제: $HTTP_CODE2)"
fi
echo ""

# 3. Signup API 테스트 (누락된 필드)
echo "3️⃣ Signup API - 누락된 필드 (400 기대)"
RESPONSE3=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST https://superplacestudy.pages.dev/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}')

HTTP_CODE3=$(echo "$RESPONSE3" | grep "HTTP_CODE:" | cut -d: -f2)
BODY3=$(echo "$RESPONSE3" | grep -v "HTTP_CODE:")

echo "  Status: $HTTP_CODE3"
echo "  Body: $BODY3"

if [ "$HTTP_CODE3" = "400" ]; then
  echo "  ✅ Signup API 정상 작동 (400 Bad Request)"
else
  echo "  ❌ Signup API 오류 (예상: 400, 실제: $HTTP_CODE3)"
fi
echo ""

# 결과 요약
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 검증 결과 요약"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SUCCESS_COUNT=0
TOTAL_COUNT=3

if [ "$HTTP_CODE1" = "401" ]; then
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
fi

if [ "$HTTP_CODE2" = "200" ]; then
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
fi

if [ "$HTTP_CODE3" = "400" ]; then
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
fi

echo "✅ 성공: $SUCCESS_COUNT / $TOTAL_COUNT"

if [ "$SUCCESS_COUNT" = "$TOTAL_COUNT" ]; then
  echo ""
  echo "🎉 모든 테스트 통과! 프로덕션 배포 성공!"
  echo ""
  echo "🌐 브라우저 테스트:"
  echo "   1. 시크릿 모드로 https://superplacestudy.pages.dev/login 접속"
  echo "   2. 테스트 계정으로 로그인:"
  echo "      - admin@superplace.com / admin1234"
  echo "      - director@superplace.com / director1234"
  echo "   3. 대시보드 정상 표시 확인"
  echo ""
else
  echo ""
  echo "❌ 일부 테스트 실패. Cloudflare 빌드가 아직 진행 중일 수 있습니다."
  echo "   2-3분 후 다시 실행해주세요:"
  echo "   bash verify_production_final.sh"
  echo ""
fi
