#!/bin/bash

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "🔍 Vectorize 검색 디버깅..."
echo ""

# 1. 임베딩 생성
echo "1️⃣ 쿼리 임베딩 생성..."
QUERY_EMBED=$(curl -s -X POST "$WORKER_URL/generate-embedding" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"text": "What is Pythagorean theorem?"}')

echo "  임베딩 차원: $(echo "$QUERY_EMBED" | jq '.dimensions')"
echo "  성공: $(echo "$QUERY_EMBED" | jq '.success')"
echo ""

# 2. 지식 업로드 (영어 텍스트로)
echo "2️⃣ 지식 베이스 업로드..."
KNOWLEDGE_TEXT="The Pythagorean theorem is a fundamental relation in Euclidean geometry among the three sides of a right triangle. It states that the area of the square whose side is the hypotenuse is equal to the sum of the areas of the squares on the other two sides. The theorem can be written as: a² + b² = c²"

KNOW_EMBED=$(curl -s -X POST "$WORKER_URL/generate-embedding" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"text\": \"$KNOWLEDGE_TEXT\"}")

KNOW_EMBEDDING=$(echo "$KNOW_EMBED" | jq -c '.embedding')

UPLOAD=$(curl -s -X POST "$WORKER_URL/vectorize-upload" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"vectors\": [{
      \"id\": \"test-pythagoras-v2\",
      \"values\": $KNOW_EMBEDDING,
      \"metadata\": {
        \"botId\": \"test-bot-v2\",
        \"fileName\": \"pythagoras_theorem.txt\",
        \"text\": \"$KNOWLEDGE_TEXT\"
      }
    }]
  }")

echo "  $(echo "$UPLOAD" | jq -r '.message')"
echo ""

# 3. RAG 검색 (영어로)
echo "3️⃣ RAG 검색 테스트..."
CHAT=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "message": "What is Pythagorean theorem?",
    "botId": "test-bot-v2",
    "userId": 1,
    "enableRAG": true,
    "topK": 3,
    "systemPrompt": "You are a helpful teacher.",
    "conversationHistory": []
  }')

echo "  RAG 활성화: $(echo "$CHAT" | jq -r '.ragEnabled')"
echo "  컨텍스트 수: $(echo "$CHAT" | jq -r '.ragContextCount')"
echo ""
echo "  응답:"
echo "$CHAT" | jq -r '.response' | head -5
echo ""

if [ "$(echo "$CHAT" | jq -r '.ragEnabled')" = "true" ]; then
  echo "✅ RAG 작동 성공!"
else
  echo "❌ RAG 미작동 - 전체 응답:"
  echo "$CHAT" | jq '.'
fi
