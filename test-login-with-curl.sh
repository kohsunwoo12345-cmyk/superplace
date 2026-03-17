#!/bin/bash

echo "🔐 cURL로 직접 로그인 API 테스트"
echo "======================================"
echo ""

echo "1️⃣ ADMIN 계정 테스트"
echo "Email: admin@superplace.co.kr"
echo "Password: admin1234!"
echo ""

curl -X POST "https://superplacestudy.pages.dev/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.co.kr","password":"admin1234!"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "======================================"
echo ""
echo "2️⃣ kohsunwoo12345 계정 테스트"
echo "Email: kohsunwoo12345@gmail.com"
echo "Password: rhtjsdn1121"
echo ""

curl -X POST "https://superplacestudy.pages.dev/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"kohsunwoo12345@gmail.com","password":"rhtjsdn1121"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'
  
echo ""
echo "======================================"
echo "✅ 테스트 완료"
