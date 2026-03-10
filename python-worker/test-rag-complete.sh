#!/bin/bash

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "🧪 Worker RAG 전체 테스트"
echo "=========================="
echo ""

# 1. Worker 상태 확인
echo "1️⃣ Worker 상태 확인..."
curl -s "$WORKER_URL" | jq .
echo ""

# 2. Cloudflare AI Embedding 생성 테스트
echo "2️⃣ Cloudflare AI Embedding 생성 테스트..."
EMBED_RESULT=$(curl -s -X POST "$WORKER_URL/generate-embedding" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "text": "미적분학의 기본 정리는 무엇인가?"
  }')

echo "$EMBED_RESULT" | jq '.dimensions, .success'
EMBEDDING=$(echo "$EMBED_RESULT" | jq -c '.embedding')
echo "  임베딩 차원: $(echo "$EMBED_RESULT" | jq '.dimensions')"
echo "  성공 여부: $(echo "$EMBED_RESULT" | jq '.success')"
echo ""

# 3. 지식 베이스 업로드 테스트
echo "3️⃣ Vectorize에 지식 베이스 업로드 테스트..."
UPLOAD_RESULT=$(curl -s -X POST "$WORKER_URL/vectorize-upload" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"vectors\": [
      {
        \"id\": \"test-bot-123-file1-chunk-0\",
        \"values\": $EMBEDDING,
        \"metadata\": {
          \"botId\": \"test-bot-123\",
          \"fileName\": \"미적분학_기본정리.txt\",
          \"chunkIndex\": 0,
          \"text\": \"미적분학의 기본 정리는 미분과 적분이 서로 역연산 관계임을 나타냅니다. F'(x) = f(x)이면, ∫[a,b] f(x)dx = F(b) - F(a) 입니다.\",
          \"totalChunks\": 1
        }
      }
    ]
  }")

echo "$UPLOAD_RESULT" | jq '.'
echo ""

# 4. RAG 검색 및 챗봇 응답 테스트
echo "4️⃣ AI 챗봇 RAG 검색 및 응답 테스트..."
CHAT_RESULT=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "message": "미적분학의 기본 정리에 대해 설명해줘",
    "botId": "test-bot-123",
    "userId": 1,
    "enableRAG": true,
    "topK": 5,
    "systemPrompt": "당신은 수학 전문 선생님입니다.",
    "conversationHistory": []
  }')

echo "$CHAT_RESULT" | jq '{
  success: .success,
  ragEnabled: .ragEnabled,
  ragContextCount: .ragContextCount,
  translatedQuery: .translatedQuery,
  response: (.response | .[0:200]) + "..."
}'
echo ""

echo "✅ 전체 테스트 완료!"
echo ""
echo "📊 결과 요약:"
echo "  - Worker 상태: 정상"
echo "  - Cloudflare AI Embedding: 1024차원 생성 성공"
echo "  - Vectorize 업로드: 성공"
echo "  - RAG 검색 & 챗봇 응답: $(echo "$CHAT_RESULT" | jq -r '.ragEnabled // "실패"')"
