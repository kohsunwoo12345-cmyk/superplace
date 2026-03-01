#!/bin/bash

echo "========================================="
echo "🧪 Kakao API 테스트 스크립트"
echo "========================================="
echo ""

BASE_URL="https://superplacestudy.pages.dev"

echo "1️⃣  Channels API 테스트"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/kakao/channels?userId=test123" | jq .
echo ""

echo "2️⃣  Templates API 테스트"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/kakao/templates?userId=test123" | jq .
echo ""

echo "3️⃣  Categories API 테스트"
echo "----------------------------------------"
curl -s "${BASE_URL}/api/kakao/get-categories" | jq '.success, .source, (.categories | length)'
echo ""

echo "========================================="
echo "✅ 테스트 완료"
echo "========================================="
