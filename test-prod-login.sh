#!/bin/bash

echo "=== Vercel 프로덕션 로그인 테스트 ==="
echo ""

# 프로덕션 URL
PROD_URL="https://superplacestudy.vercel.app"

echo "Step 1: CSRF 토큰 가져오기..."
CSRF_RESPONSE=$(curl -s -c cookies-prod.txt "${PROD_URL}/api/auth/csrf")
echo "CSRF Response: $CSRF_RESPONSE"

CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "CSRF Token: $CSRF_TOKEN"
echo ""

if [ -z "$CSRF_TOKEN" ]; then
  echo "❌ CSRF 토큰을 가져올 수 없습니다."
  echo ""
  echo "HTML 응답 확인:"
  curl -s "${PROD_URL}/api/auth/csrf" | head -20
  exit 1
fi

echo "Step 2: 로그인 시도..."
LOGIN_RESPONSE=$(curl -s -b cookies-prod.txt -c cookies-prod.txt \
  -X POST "${PROD_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=${CSRF_TOKEN}&email=admin@superplace.com&password=admin123!@%23&callbackUrl=${PROD_URL}/dashboard")

echo "Login Response:"
echo "$LOGIN_RESPONSE" | head -50
echo ""

echo "Step 3: 세션 확인..."
SESSION_RESPONSE=$(curl -s -b cookies-prod.txt "${PROD_URL}/api/auth/session")
echo "Session Response:"
echo "$SESSION_RESPONSE"
echo ""

if echo "$SESSION_RESPONSE" | grep -q "email"; then
  echo "✅ 로그인 성공!"
  echo "사용자 정보: $SESSION_RESPONSE"
else
  echo "❌ 로그인 실패"
  echo ""
  echo "에러 페이지 확인:"
  curl -s -b cookies-prod.txt "${PROD_URL}/auth/signin" | grep -i error | head -5
fi
