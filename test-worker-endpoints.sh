#!/bin/bash

WORKER_BASE="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
WORKER_API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "==================================="
echo "🧪 Worker 엔드포인트 테스트"
echo "==================================="
echo ""

# 1. Root 엔드포인트
echo "1️⃣ GET /"
curl -s "$WORKER_BASE/" | head -c 200
echo ""
echo ""

# 2. /chat 엔드포인트
echo "2️⃣ POST /chat"
curl -s -X POST "$WORKER_BASE/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $WORKER_API_KEY" \
  -d '{"message":"test"}' \
  -w " [Status: %{http_code}]"
echo ""
echo ""

# 3. /bot/chat 엔드포인트
echo "3️⃣ POST /bot/chat"
curl -s -X POST "$WORKER_BASE/bot/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $WORKER_API_KEY" \
  -d '{"message":"test"}' \
  -w " [Status: %{http_code}]"
echo ""
echo ""

# 4. /bot/upload-knowledge 엔드포인트
echo "4️⃣ POST /bot/upload-knowledge"
curl -s -X POST "$WORKER_BASE/bot/upload-knowledge" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $WORKER_API_KEY" \
  -d '{"botId":"test"}' \
  -w " [Status: %{http_code}]"
echo ""
echo ""

# 5. /api/chat 엔드포인트
echo "5️⃣ POST /api/chat"
curl -s -X POST "$WORKER_BASE/api/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $WORKER_API_KEY" \
  -d '{"message":"test"}' \
  -w " [Status: %{http_code}]"
echo ""

echo "==================================="
