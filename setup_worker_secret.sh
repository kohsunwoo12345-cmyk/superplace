#!/bin/bash

WORKER_NAME="physonsuperplacestudy-production"
ACCOUNT_ID="kohsunwoo12345"
API_TOKEN="xL-fXyCJpmj-gupSAYr12YDIZ6Xy1lXUOUmihLMb"

echo "🔧 Python Worker 환경 변수 설정"
echo "=========================================="
echo "Worker: $WORKER_NAME"
echo "API Token: $API_TOKEN"
echo ""

# API 키를 Secret으로 설정
echo "1️⃣ API 키를 Worker Secret으로 설정 중..."

# Cloudflare API를 사용하여 Secret 설정
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/secrets/API_KEY" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"API_KEY\",\"text\":\"gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u\",\"type\":\"secret_text\"}"

echo ""
echo "=========================================="
echo "✅ 완료"

