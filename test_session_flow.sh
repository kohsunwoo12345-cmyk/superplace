#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "=== 1. 세션 조회 테스트 (userId=1) ==="
curl -s "${BASE_URL}/api/chat-sessions?userId=1" | jq '.'

echo ""
echo "=== 2. 세션 조회 테스트 (userId=admin) ==="
curl -s "${BASE_URL}/api/chat-sessions?userId=admin" | jq '.'

echo ""
echo "=== 3. 관리자 봇 목록 조회 ==="
curl -s "${BASE_URL}/api/admin/ai-bots" | jq '.count, .bots[0].name'

echo ""
echo "✅ 테스트 완료"
