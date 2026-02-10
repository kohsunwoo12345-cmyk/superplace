#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "=========================================="
echo "🔍 클래스 API 테스트"
echo "=========================================="

echo ""
echo "1️⃣ /api/classes/manage 호출 (현재 프론트엔드가 사용하는 엔드포인트)"
curl -s "${BASE_URL}/api/classes/manage" | jq '.' || echo "❌ 404 또는 오류"

echo ""
echo "2️⃣ /api/classes 호출 (실제 존재하는 엔드포인트)"
curl -s "${BASE_URL}/api/classes" | jq '.'

echo ""
echo "3️⃣ /api/classes?academyId=1 호출"
curl -s "${BASE_URL}/api/classes?academyId=1" | jq '.'

echo ""
echo "=========================================="
echo "✅ 테스트 완료"
echo "=========================================="
