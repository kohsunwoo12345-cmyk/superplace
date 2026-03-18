#!/bin/bash

API_TOKEN="IMD0nKq28gqav_5BytcRDBhFNJDbvqVswrZVfKtp"
ACCOUNT_ID="117379ce5c9d9af026b16c9cf21b10d5"
WORKER_NAME="physonsuperplacestudy"

echo "==================================="
echo "🚀 Worker 배포 시작"
echo "==================================="
echo ""
echo "📦 Worker: $WORKER_NAME"
echo "🔑 Account ID: $ACCOUNT_ID"
echo ""

# Worker 스크립트 읽기
WORKER_SCRIPT=$(cat worker.js)

# Metadata 생성 (바인딩 포함)
METADATA=$(cat <<'METAEOF'
{
  "main_module": "worker.js",
  "bindings": [
    {
      "type": "ai",
      "name": "AI"
    },
    {
      "type": "vectorize",
      "name": "VECTORIZE",
      "index_name": "knowledge-base-embeddings"
    },
    {
      "type": "d1",
      "name": "DB",
      "id": "8c106540-21b4-4fa9-8879-c4956e459ca1"
    }
  ],
  "compatibility_date": "2024-01-01"
}
METAEOF
)

# 멀티파트 폼 데이터로 Worker 업로드
echo "📤 Worker 업로드 중..."
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "metadata=@-;type=application/json" \
  -F "worker.js=@worker.js;type=application/javascript+module" \
  <<< "$METADATA" \
  -w "\n\n📊 HTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "==================================="
echo "✅ Worker 배포 완료"
echo "==================================="
echo ""
echo "🌐 Worker URL: https://$WORKER_NAME.kohsunwoo12345.workers.dev"
echo ""
