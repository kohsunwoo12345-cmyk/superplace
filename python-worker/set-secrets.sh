#!/bin/bash

API_TOKEN="IMD0nKq28gqav_5BytcRDBhFNJDbvqVswrZVfKtp"
ACCOUNT_ID="117379ce5c9d9af026b16c9cf21b10d5"
WORKER_NAME="physonsuperplacestudy"

echo "==================================="
echo "🔐 Worker 환경 변수 설정"
echo "==================================="
echo ""

# WORKER_API_KEY 설정
echo "1️⃣ WORKER_API_KEY 설정 중..."
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/settings" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": [
      {
        "name": "WORKER_API_KEY",
        "type": "secret_text",
        "text": "gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"
      }
    ]
  }' -s | jq '.success'

echo ""

# API_KEY 설정
echo "2️⃣ API_KEY 설정 중..."
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/settings" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": [
      {
        "name": "API_KEY",
        "type": "secret_text",
        "text": "gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"
      }
    ]
  }' -s | jq '.success'

echo ""

# GOOGLE_GEMINI_API_KEY 설정
echo "3️⃣ GOOGLE_GEMINI_API_KEY 설정 중..."
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/settings" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": [
      {
        "name": "GOOGLE_GEMINI_API_KEY",
        "type": "secret_text",
        "text": "AIzaSyDiTHK0p3u0LGvQbmvZwRKaFXOwX4pJFqk"
      }
    ]
  }' -s | jq '.success'

echo ""
echo "==================================="
echo "✅ 환경 변수 설정 완료"
echo "==================================="
