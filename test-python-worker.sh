#!/bin/bash

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"

echo "🧪 Python Worker 테스트 시작..."
echo "🔗 Worker URL: $WORKER_URL"
echo ""

echo "1️⃣ /solve 엔드포인트 테스트..."
RESULT=$(curl -s -X POST "${WORKER_URL}/solve" \
  -H "Content-Type: application/json" \
  -d '{"equation":"3 + 5"}')

echo "📊 응답: $RESULT"
echo ""

echo "2️⃣ 복잡한 계산 테스트..."
RESULT=$(curl -s -X POST "${WORKER_URL}/solve" \
  -H "Content-Type: application/json" \
  -d '{"equation":"(10 + 5) * 2 - 3"}')

echo "📊 응답: $RESULT"
echo ""

echo "✅ Python Worker 테스트 완료"
