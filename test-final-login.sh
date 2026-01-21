#!/bin/bash

BASE_URL="https://3013-iftozwzhzim0qta6v3gft-b237eb32.sandbox.novita.ai"
COOKIE_FILE="cookies-final.txt"

echo "🔐 최종 관리자 로그인 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: CSRF 토큰 가져오기
echo "📍 Step 1: CSRF 토큰 가져오기"
CSRF_RESPONSE=$(curl -s -c "$COOKIE_FILE" "$BASE_URL/api/auth/csrf")
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CSRF_TOKEN" ]; then
    echo "❌ CSRF 토큰을 가져올 수 없습니다"
    exit 1
fi

echo "✅ CSRF 토큰: ${CSRF_TOKEN:0:20}..."
echo ""

# Step 2: 로그인 시도
echo "📍 Step 2: 로그인 시도"
echo "   이메일: admin@superplace.com"
echo "   비밀번호: admin123!@#"

LOGIN_RESPONSE=$(curl -s -X POST \
    -b "$COOKIE_FILE" \
    -c "$COOKIE_FILE" \
    "$BASE_URL/api/auth/callback/credentials" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "csrfToken=$CSRF_TOKEN&email=admin@superplace.com&password=admin123!@#&callbackUrl=/dashboard&json=true")

echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Step 3: 세션 확인
echo "📍 Step 3: 세션 확인"
SESSION_RESPONSE=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/api/auth/session")

echo "$SESSION_RESPONSE" | jq '.' 2>/dev/null

if echo "$SESSION_RESPONSE" | grep -q "admin@superplace.com"; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ 로그인 성공!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "👤 사용자 정보:"
    echo "$SESSION_RESPONSE" | jq -r '"   이름: \(.user.name)\n   이메일: \(.user.email)\n   역할: \(.user.role)"' 2>/dev/null
    echo ""
    echo "🌐 로그인 URL:"
    echo "   $BASE_URL/auth/signin"
    exit 0
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ 로그인 실패"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi
