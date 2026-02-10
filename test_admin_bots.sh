#!/bin/bash

echo "🧪 AI 챗봇 관리자 접근 테스트"
echo "================================"
echo ""

# 배포 URL
BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "1️⃣ 관리자 API - 모든 봇 조회"
echo "GET ${BASE_URL}/api/admin/ai-bots"
echo ""

curl -s "${BASE_URL}/api/admin/ai-bots" | jq '.' || curl -s "${BASE_URL}/api/admin/ai-bots"

echo ""
echo ""
echo "2️⃣ 사용자 API - 할당된 봇 조회 (academyId 테스트)"
echo "GET ${BASE_URL}/api/user/ai-bots?academyId=test-academy"
echo ""

curl -s "${BASE_URL}/api/user/ai-bots?academyId=test-academy" | jq '.' || curl -s "${BASE_URL}/api/user/ai-bots?academyId=test-academy"

echo ""
echo ""
echo "3️⃣ 봇 할당 목록 조회"
echo "GET ${BASE_URL}/api/admin/bot-assignments"
echo ""

curl -s "${BASE_URL}/api/admin/bot-assignments" | jq '.' || curl -s "${BASE_URL}/api/admin/bot-assignments"

echo ""
echo ""
echo "================================"
echo "✅ 테스트 완료"
