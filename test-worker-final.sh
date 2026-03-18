#!/bin/bash

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "==================================="
echo "🧪 Worker RAG 기능 최종 테스트"
echo "==================================="
echo ""

# 1. Root 엔드포인트
echo "1️⃣ GET / (상태 확인)"
curl -s "$WORKER_URL/" | jq '.'
echo ""
echo ""

# 2. /chat 엔드포인트 테스트
echo "2️⃣ POST /chat (RAG 챗봇)"
curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "message": "안녕하세요",
    "botId": "test-bot",
    "enableRAG": false,
    "systemPrompt": "당신은 친절한 AI입니다."
  }' | jq '.'
echo ""
echo ""

# 3. /bot/upload-knowledge 엔드포인트 테스트
echo "3️⃣ POST /bot/upload-knowledge (지식 베이스 업로드)"
curl -s -X POST "$WORKER_URL/bot/upload-knowledge" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "botId": "test-bot-123",
    "fileName": "test-knowledge.txt",
    "fileContent": "테스트 지식: 수플레이스는 최고의 학습 플랫폼입니다. 우리는 AI 기반 맞춤형 학습을 제공합니다."
  }' | jq '.'
echo ""
echo ""

echo "==================================="
echo "✅ 테스트 완료"
echo "==================================="
