#!/bin/bash

ACCOUNT_ID="117379ce5c9d9af026b16c9cf21b10d5"
WORKER_NAME="physonsuperplacestudy-production"
WORKERS_API_TOKEN="xL-fXyCJpmj-gupSAYr12YDIZ6Xy1lXUOUmihLMb"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "🔧 Worker API_KEY Secret 업데이트"
echo "======================================"

# PATCH를 사용하여 Secret 업데이트
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/settings" \
  -H "Authorization: Bearer $WORKERS_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"bindings\": [
      {
        \"type\": \"secret_text\",
        \"name\": \"API_KEY\",
        \"text\": \"$API_KEY\"
      }
    ]
  }" | jq '.'

echo ""
echo "⏳ 20초 대기 (Worker 재시작)..."
sleep 20

echo ""
echo "🧪 테스트..."
./test_grade_api_directly.sh

