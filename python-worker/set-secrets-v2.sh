#!/bin/bash

API_TOKEN="IMD0nKq28gqav_5BytcRDBhFNJDbvqVswrZVfKtp"
ACCOUNT_ID="117379ce5c9d9af026b16c9cf21b10d5"
WORKER_NAME="physonsuperplacestudy"

echo "==================================="
echo "🔐 Worker 환경 변수 설정 (v2)"
echo "==================================="
echo ""

# WORKER_API_KEY
echo "1️⃣ WORKER_API_KEY..."
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/secrets" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "WORKER_API_KEY",
    "text": "gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u",
    "type": "secret_text"
  }' -s | jq -r '.success // .errors[0].message // "설정 완료"'

echo ""

# API_KEY  
echo "2️⃣ API_KEY..."
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/secrets" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API_KEY",
    "text": "gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u",
    "type": "secret_text"
  }' -s | jq -r '.success // .errors[0].message // "설정 완료"'

echo ""

# GOOGLE_GEMINI_API_KEY
echo "3️⃣ GOOGLE_GEMINI_API_KEY..."
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/secrets" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GOOGLE_GEMINI_API_KEY",
    "text": "AIzaSyDiTHK0p3u0LGvQbmvZwRKaFXOwX4pJFqk",
    "type": "secret_text"
  }' -s | jq -r '.success // .errors[0].message // "설정 완료"'

echo ""
echo "==================================="
echo "✅ 완료"
echo "==================================="
