#!/bin/bash

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev/chat"
WORKER_API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "==================================="
echo "🧪 Worker RAG 테스트"
echo "==================================="
echo ""
echo "📤 Worker URL: $WORKER_URL"
echo ""

# 테스트 요청
curl -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $WORKER_API_KEY" \
  -d '{
    "message": "안녕하세요",
    "botId": "test-bot-id",
    "enableRAG": true,
    "topK": 5,
    "systemPrompt": "당신은 친절한 AI입니다.",
    "conversationHistory": []
  }' \
  -w "\n\n📊 HTTP Status: %{http_code}\n" \
  -s

echo ""
echo "==================================="
