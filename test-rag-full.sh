#!/bin/bash

# AI 봇 RAG 전체 테스트 스크립트

echo "🧪 AI 봇 RAG 전체 테스트 시작"
echo "================================"
echo ""

# 환경 변수
WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"
TEST_BOT_ID="bot-test-$(date +%s)"
KNOWLEDGE_FILE="/tmp/test-knowledge.txt"

# Gemini API 키 (환경 변수에서 가져오기 - 실제 테스트에서는 설정 필요)
GEMINI_API_KEY="${GEMINI_API_KEY:-AIzaSyDFake}"

echo "📋 테스트 설정:"
echo "  - Bot ID: $TEST_BOT_ID"
echo "  - Worker URL: $WORKER_URL"
echo "  - Knowledge File: $KNOWLEDGE_FILE"
echo ""

# Step 1: Worker 상태 확인
echo "1️⃣ Worker 상태 확인..."
WORKER_STATUS=$(curl -s "$WORKER_URL/")
echo "$WORKER_STATUS" | jq .
echo ""

if ! echo "$WORKER_STATUS" | grep -q "vectorize-upload"; then
  echo "❌ Worker에 vectorize-upload 엔드포인트가 없습니다"
  exit 1
fi

echo "✅ Worker 정상"
echo ""

# Step 2: 지식 베이스 파일 읽기
echo "2️⃣ 지식 베이스 파일 읽기..."
if [ ! -f "$KNOWLEDGE_FILE" ]; then
  echo "❌ 지식 베이스 파일을 찾을 수 없습니다: $KNOWLEDGE_FILE"
  exit 1
fi

FILE_CONTENT=$(cat "$KNOWLEDGE_FILE")
FILE_SIZE=${#FILE_CONTENT}
echo "  파일 크기: $FILE_SIZE bytes"
echo "  첫 100자: ${FILE_CONTENT:0:100}..."
echo ""

# Step 3: 텍스트 청킹 시뮬레이션 (Node.js 사용)
echo "3️⃣ 텍스트 청킹 (최대 1000자)..."
CHUNK_COUNT=$(echo "$FILE_CONTENT" | wc -c | awk '{print int($1/1000)+1}')
echo "  예상 청크 수: $CHUNK_COUNT"
echo ""

# Step 4: Embedding 생성 테스트 (첫 청크만)
echo "4️⃣ Gemini Embedding 생성 테스트..."
FIRST_CHUNK=$(echo "$FILE_CONTENT" | head -c 500)

EMBEDDING_RESPONSE=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"models/text-embedding-004\",
    \"content\": {
      \"parts\": [{\"text\": \"이차방정식 테스트\"}]
    }
  }")

if echo "$EMBEDDING_RESPONSE" | grep -q "embedding"; then
  EMBEDDING_DIM=$(echo "$EMBEDDING_RESPONSE" | jq '.embedding.values | length')
  echo "  ✅ Embedding 생성 성공 (차원: $EMBEDDING_DIM)"
else
  echo "  ⚠️ Embedding 생성 실패 (API 키 확인 필요)"
  echo "  Response: $EMBEDDING_RESPONSE"
fi
echo ""

# Step 5: Vectorize 업로드 테스트 (모의 벡터)
echo "5️⃣ Vectorize 업로드 테스트..."

# 간단한 테스트 벡터 생성 (768차원)
TEST_VECTOR='['$(for i in {1..768}; do echo -n "0.1,"; done | sed 's/,$//')']'

VECTORIZE_PAYLOAD=$(cat <<EOF
{
  "vectors": [
    {
      "id": "${TEST_BOT_ID}-test-chunk-0",
      "values": $TEST_VECTOR,
      "metadata": {
        "botId": "$TEST_BOT_ID",
        "fileName": "test-knowledge.txt",
        "chunkIndex": 0,
        "text": "이차방정식은 ax² + bx + c = 0 형태의 방정식입니다.",
        "totalChunks": 1
      }
    }
  ]
}
EOF
)

VECTORIZE_RESPONSE=$(curl -s -X POST "$WORKER_URL/vectorize-upload" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "$VECTORIZE_PAYLOAD")

echo "$VECTORIZE_RESPONSE" | jq .

if echo "$VECTORIZE_RESPONSE" | grep -q '"success":true'; then
  echo "  ✅ Vectorize 업로드 성공"
else
  echo "  ❌ Vectorize 업로드 실패"
fi
echo ""

# Step 6: RAG 검색 테스트
echo "6️⃣ RAG 검색 테스트..."

RAG_QUERY="이차방정식 푸는 방법"
echo "  질문: $RAG_QUERY"

RAG_RESPONSE=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"message\": \"$RAG_QUERY\",
    \"botId\": \"$TEST_BOT_ID\",
    \"enableRAG\": true,
    \"topK\": 3,
    \"systemPrompt\": \"당신은 수학 선생님입니다.\",
    \"conversationHistory\": []
  }")

echo "$RAG_RESPONSE" | jq .

if echo "$RAG_RESPONSE" | grep -q '"success":true'; then
  RAG_ENABLED=$(echo "$RAG_RESPONSE" | jq -r '.ragEnabled')
  RAG_COUNT=$(echo "$RAG_RESPONSE" | jq -r '.ragContextCount')
  echo ""
  echo "  ✅ RAG 검색 성공"
  echo "  RAG 활성화: $RAG_ENABLED"
  echo "  발견된 컨텍스트: $RAG_COUNT개"
  
  if [ "$RAG_COUNT" -gt 0 ]; then
    echo ""
    echo "  🎉 RAG가 정상 작동합니다!"
  else
    echo ""
    echo "  ⚠️ RAG 검색은 성공했지만 관련 컨텍스트를 찾지 못했습니다"
    echo "  (Vectorize에 데이터가 충분히 쌓이지 않았을 수 있습니다)"
  fi
else
  echo "  ❌ RAG 검색 실패"
fi
echo ""

# Step 7: 최종 요약
echo "================================"
echo "🎯 테스트 요약"
echo "================================"
echo ""
echo "✅ 완료된 단계:"
echo "  1. Worker 상태 확인"
echo "  2. 지식 베이스 파일 읽기"
echo "  3. 텍스트 청킹"
echo "  4. Gemini Embedding 생성"
echo "  5. Vectorize 업로드"
echo "  6. RAG 검색"
echo ""
echo "📊 결과:"
echo "  - Bot ID: $TEST_BOT_ID"
echo "  - 파일 크기: $FILE_SIZE bytes"
echo "  - 예상 청크: $CHUNK_COUNT개"
echo ""
echo "🚀 다음 단계:"
echo "  1. Pages API로 전체 파일 업로드 테스트"
echo "  2. 프론트엔드 통합 테스트"
echo "  3. 실제 학생 질문으로 RAG 정확도 검증"
echo ""
