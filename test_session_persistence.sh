#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "=== 1. 실제 관리자 계정으로 세션 조회 ==="
echo "userId: admin@superplace.co.kr"
curl -s "${BASE_URL}/api/chat-sessions?userId=admin@superplace.co.kr" | jq '.'

echo ""
echo "=== 2. userId=1로 세션 조회 ==="
curl -s "${BASE_URL}/api/chat-sessions?userId=1" | jq '.'

echo ""
echo "=== 3. 모든 세션 확인 (다양한 userId 시도) ==="
for userId in "admin@superplace.co.kr" "1" "test-user" "admin"; do
  echo "--- userId: $userId ---"
  result=$(curl -s "${BASE_URL}/api/chat-sessions?userId=$userId")
  count=$(echo "$result" | jq -r '.count')
  echo "세션 개수: $count"
  if [ "$count" != "0" ]; then
    echo "$result" | jq -r '.sessions[] | "  - \(.title) (lastMessage: \(.lastMessage | .[0:50]))"'
  fi
  echo ""
done

echo "✅ 테스트 완료"
