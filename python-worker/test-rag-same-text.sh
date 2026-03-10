#!/bin/bash

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "🧪 RAG 정확도 테스트 (동일 텍스트)"
echo "====================================="
echo ""

# 1. 테스트 텍스트 
TEST_TEXT="피타고라스 정리는 직각삼각형에서 빗변의 제곱은 다른 두 변의 제곱의 합과 같다는 정리입니다."

echo "1️⃣ 임베딩 생성 및 업로드..."
EMBED=$(curl -s -X POST "$WORKER_URL/generate-embedding" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"text\": \"$TEST_TEXT\"}")

EMBEDDING=$(echo "$EMBED" | jq -c '.embedding')

# 고유한 botId 사용
BOT_ID="test-bot-$(date +%s)"

curl -s -X POST "$WORKER_URL/vectorize-upload" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"vectors\": [{
      \"id\": \"$BOT_ID-chunk-1\",
      \"values\": $EMBEDDING,
      \"metadata\": {
        \"botId\": \"$BOT_ID\",
        \"fileName\": \"test.txt\",
        \"text\": \"$TEST_TEXT\"
      }
    }]
  }" > /dev/null

echo "  ✅ 업로드 완료 (botId: $BOT_ID)"
echo ""

# 2. 정확히 동일한 텍스트로 검색
echo "2️⃣ 동일한 텍스트로 RAG 검색..."
RESULT=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"message\": \"$TEST_TEXT\",
    \"botId\": \"$BOT_ID\",
    \"enableRAG\": true,
    \"systemPrompt\": \"제공된 지식을 바탕으로 답변하세요.\"
  }")

echo "$RESULT" | jq '{
  ragEnabled: .ragEnabled,
  ragContextCount: .ragContextCount,
  hasResponse: (.response != null)
}'

echo ""
if [ "$(echo "$RESULT" | jq -r '.ragEnabled')" = "true" ]; then
  echo "✅ RAG가 성공적으로 작동했습니다!"
  echo ""
  echo "📚 RAG 컨텍스트:"
  echo "  검색된 문서 수: $(echo "$RESULT" | jq -r '.ragContextCount')"
else
  echo "⚠️ RAG가 활성화되지 않았습니다."
fi
