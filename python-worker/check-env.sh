#!/bin/bash

ACCOUNT_ID="117379ce5c9d9af026b16c9cf21b10d5"
WORKER_NAME="physonsuperplacestudy"
API_TOKEN="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "🔍 Worker 환경 변수 확인..."
echo ""

curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/settings" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" | jq '.result.bindings[] | select(.type == "plain_text") | {name: .name, text: .text}'
