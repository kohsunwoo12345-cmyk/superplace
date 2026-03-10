#!/bin/bash

# Cloudflare Workers API를 사용한 Python Worker 배포

WORKER_NAME="physonsuperplacestudy"
API_TOKEN="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "🚀 Python Worker 배포 시작..."
echo "Worker 이름: $WORKER_NAME"

# Account ID 조회
echo ""
echo "📋 Account ID 조회 중..."
ACCOUNT_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $ACCOUNT_RESPONSE"

ACCOUNT_ID=$(echo $ACCOUNT_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ACCOUNT_ID" ]; then
  echo "❌ Account ID를 찾을 수 없습니다."
  echo "API 토큰을 확인해주세요."
  exit 1
fi

echo "✅ Account ID: $ACCOUNT_ID"

# Worker 스크립트 업로드
echo ""
echo "📤 Worker 스크립트 업로드 중..."

# metadata.json 생성
cat > metadata.json << 'METADATA_EOF'
{
  "main_module": "worker.py",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["python_workers"]
}
METADATA_EOF

# Worker 배포
DEPLOY_RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "metadata=@metadata.json;type=application/json" \
  -F "worker.py=@worker.py;type=application/python")

echo "Deploy Response: $DEPLOY_RESPONSE"

if echo "$DEPLOY_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Worker 배포 성공!"
  echo ""
  echo "🌐 Worker URL: https://$WORKER_NAME.kohsunwoo12345.workers.dev"
  echo ""
  echo "⚠️  다음 단계:"
  echo "1. Cloudflare Dashboard에서 GEMINI_API_KEY 환경 변수 설정"
  echo "2. https://dash.cloudflare.com/ → Workers & Pages → $WORKER_NAME → Settings → Variables"
else
  echo "❌ Worker 배포 실패"
  echo "$DEPLOY_RESPONSE"
fi

# 정리
rm -f metadata.json

