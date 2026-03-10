#!/bin/bash

# Vectorize 인덱스 생성 스크립트

ACCOUNT_ID="117379ce5c9d9af026b16c9cf21b10d5"
API_TOKEN="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"
INDEX_NAME="ai-chatbot-knowledge"

echo "📊 Vectorize 인덱스 생성 중..."
echo "Index Name: $INDEX_NAME"
echo ""

# Vectorize 인덱스 생성 (768차원, Gemini text-embedding-004)
CREATE_RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/vectorize/indexes" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$INDEX_NAME\",
    \"config\": {
      \"dimensions\": 768,
      \"metric\": \"cosine\"
    }
  }")

echo "$CREATE_RESPONSE" | jq .

if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "✅ Vectorize 인덱스 생성 성공!"
  echo ""
  echo "다음 단계:"
  echo "1. wrangler.toml 확인"
  echo "2. Worker 재배포"
  echo "3. RAG 테스트"
else
  echo ""
  echo "⚠️ 인덱스 생성 실패 또는 이미 존재함"
  echo ""
  echo "기존 인덱스 확인 중..."
  LIST_RESPONSE=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/vectorize/indexes" \
    -H "Authorization: Bearer $API_TOKEN")
  
  echo "$LIST_RESPONSE" | jq '.result[] | select(.name == "'$INDEX_NAME'")'
fi
