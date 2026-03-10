#!/bin/bash

WORKER_NAME="physonsuperplacestudy"
API_TOKEN="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"
ACCOUNT_ID="117379ce5c9d9af026b16c9cf21b10d5"

echo "🚀 Worker 업데이트 시작..."
echo "Worker: $WORKER_NAME"
echo ""

# Worker 업데이트
echo "📤 Worker 스크립트 업로이트 중..."

UPLOAD_RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/javascript" \
  --data-binary @worker.js)

echo "$UPLOAD_RESPONSE"

if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "✅ Worker 업데이트 성공!"
  echo ""
  echo "🌐 Worker URL: https://$WORKER_NAME.kohsunwoo12345.workers.dev"
  echo ""
  echo "📋 다음 단계:"
  echo "1. Worker 테스트: curl https://$WORKER_NAME.kohsunwoo12345.workers.dev/"
  echo "2. GEMINI_API_KEY 환경 변수 확인"
  echo "3. /grade 엔드포인트 테스트"
else
  echo ""
  echo "❌ Worker 업데이트 실패"
fi

