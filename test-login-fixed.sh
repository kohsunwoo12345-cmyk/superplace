#!/bin/bash

echo "🔐 관리자 로그인 테스트 (수정 버전)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="https://3012-iftozwzhzim0qta6v3gft-b237eb32.sandbox.novita.ai"

echo "📍 Step 1: CSRF 토큰 가져오기"
CSRF_RESPONSE=$(curl -s -c cookies-new.txt "${BASE_URL}/api/auth/csrf")
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CSRF_TOKEN" ]; then
    echo "❌ CSRF 토큰을 가져올 수 없습니다"
    echo "응답: $CSRF_RESPONSE"
    exit 1
fi

echo "   ✅ CSRF 토큰: ${CSRF_TOKEN:0:20}..."
echo ""

echo "📍 Step 2: 로그인 시도"
echo "   📧 이메일: admin@superplace.com"
echo "   🔑 비밀번호: admin123!@#"
echo ""

LOGIN_RESPONSE=$(curl -s -b cookies-new.txt -c cookies-new.txt -L \
  -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=${CSRF_TOKEN}" \
  -d "email=admin@superplace.com" \
  -d "password=admin123!%21%40%23" \
  -d "callbackUrl=${BASE_URL}/dashboard" \
  -d "json=true" \
  -w "\nHTTP_CODE:%{http_code}\n")

echo "$LOGIN_RESPONSE" | tail -5
echo ""

echo "📍 Step 3: 세션 확인"
SESSION_RESPONSE=$(curl -s -b cookies-new.txt "${BASE_URL}/api/auth/session")
echo "   세션 응답:"
echo "$SESSION_RESPONSE" | jq '.' 2>/dev/null || echo "$SESSION_RESPONSE"
echo ""

USER_EMAIL=$(echo "$SESSION_RESPONSE" | jq -r '.user.email' 2>/dev/null)
USER_ROLE=$(echo "$SESSION_RESPONSE" | jq -r '.user.role' 2>/dev/null)

if [ "$USER_EMAIL" = "admin@superplace.com" ] && [ "$USER_ROLE" = "SUPER_ADMIN" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ 로그인 성공!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "👤 사용자: $USER_EMAIL"
    echo "🎯 역할: $USER_ROLE"
    echo "🔗 로그인 URL: ${BASE_URL}/auth/signin"
    echo ""
    exit 0
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ 로그인 실패"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 1
fi
