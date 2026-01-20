#!/bin/bash

echo "=== 로컬 서버 테스트 (http://localhost:3000) ==="
echo ""

# 테스트할 경로들
routes=(
  "/"
  "/auth/signin"
  "/auth/signup"
  "/login"
  "/register"
  "/about"
  "/dashboard"
)

for route in "${routes[@]}"; do
  echo -n "Testing $route ... "
  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route" --max-time 5)
  
  if [ "$response" = "200" ]; then
    echo "✅ OK ($response)"
  elif [ "$response" = "307" ] || [ "$response" = "302" ]; then
    location=$(curl -s -I "http://localhost:3000$route" --max-time 5 | grep -i "location:" | cut -d' ' -f2 | tr -d '\r')
    echo "🔀 REDIRECT ($response) → $location"
  elif [ "$response" = "401" ] || [ "$response" = "403" ]; then
    echo "🔒 AUTH REQUIRED ($response)"
  else
    echo "❌ ERROR ($response)"
  fi
done

echo ""
echo "=== 링크 체크 ==="

# 홈페이지 링크 체크
echo -n "홈페이지 로그인 링크: "
if curl -s http://localhost:3000 --max-time 5 | grep -q 'href="/auth/signin"'; then
  echo "✅ /auth/signin"
else
  echo "❌ NOT FOUND"
fi

echo -n "홈페이지 회원가입 링크: "
if curl -s http://localhost:3000 --max-time 5 | grep -q 'href="/auth/signup"'; then
  echo "✅ /auth/signup"
else
  echo "❌ NOT FOUND"
fi

echo ""
echo "=== 테스트 완료 ==="
