#!/bin/bash

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"
BOT_ID="rag-delay-test-$(date +%s)"

echo "==================================="
echo "🎯 RAG 테스트 (긴 대기 시간)"
echo "==================================="
echo ""

# 지식 베이스 업로드
echo "📤 지식 베이스 업로드..."
curl -s -X POST "$WORKER_URL/bot/upload-knowledge" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"botId\": \"$BOT_ID\",
    \"fileName\": \"info.txt\",
    \"fileContent\": \"수플레이스의 CEO는 홍길동입니다. 설립일은 2023년입니다.\"
  }" | jq -r '.success'

echo "⏳ Vectorize 인덱싱 대기 (10초)..."
sleep 10

# RAG 테스트
echo ""
echo "🔍 RAG로 질문..."
RAG_RESULT=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"message\": \"CEO가 누구야?\",
    \"botId\": \"$BOT_ID\",
    \"enableRAG\": true,
    \"topK\": 5
  }")

echo "RAG 활성화: $(echo "$RAG_RESULT" | jq -r '.ragEnabled')"
echo "컨텍스트 수: $(echo "$RAG_RESULT" | jq -r '.ragContextCount')"
echo "응답: $(echo "$RAG_RESULT" | jq -r '.response' | head -c 100)..."
