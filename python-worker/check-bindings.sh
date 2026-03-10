#!/bin/bash

ACCOUNT_ID="117379ce5c9d9af026b16c9cf21b10d5"
API_TOKEN="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"
WORKER_NAME="physonsuperplacestudy"

echo "🔍 Worker 바인딩 상태 확인..."
echo ""

# Worker 설정 조회
WORKER_INFO=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/settings" \
  -H "Authorization: Bearer $API_TOKEN")

echo "$WORKER_INFO" | jq .

echo ""
echo "📊 바인딩 요약:"
echo "$WORKER_INFO" | jq -r '.result.bindings[]? | "\(.type): \(.name)"' 2>/dev/null || echo "바인딩 없음"

