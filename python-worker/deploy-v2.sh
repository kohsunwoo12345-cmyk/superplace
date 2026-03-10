#!/bin/bash

WORKER_NAME="physonsuperplacestudy"
API_TOKEN="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"
ACCOUNT_ID="117379ce5c9d9af026b16c9cf21b10d5"

echo "🚀 Python Worker 배포 (v2)..."

# Worker가 이미 존재하는지 확인
echo "📋 기존 Worker 확인 중..."
WORKER_CHECK=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
  -H "Authorization: Bearer $API_TOKEN")

if echo "$WORKER_CHECK" | grep -q '"success":true'; then
  echo "✅ Worker가 이미 존재합니다: $WORKER_NAME"
  echo ""
  echo "🌐 Worker URL: https://$WORKER_NAME.kohsunwoo12345.workers.dev"
  echo ""
  echo "⚠️  Python Worker는 Wrangler CLI를 사용하여 배포해야 합니다."
  echo ""
  echo "배포 명령어:"
  echo "  cd python-worker"
  echo "  npx wrangler deploy"
  echo ""
  echo "또는 Cloudflare Dashboard에서 직접 코드를 수정하세요:"
  echo "  https://dash.cloudflare.com/"
else
  echo "❌ Worker를 찾을 수 없습니다."
  echo ""
  echo "Python Worker는 다음 방법으로 배포하세요:"
  echo ""
  echo "1. Wrangler CLI 사용 (권장):"
  echo "   cd python-worker"
  echo "   npx wrangler deploy"
  echo ""
  echo "2. Cloudflare Dashboard 사용:"
  echo "   https://dash.cloudflare.com/"
  echo "   Workers & Pages → Create Application → Create Worker"
  echo "   이름: physonsuperplacestudy"
  echo "   코드: worker.py 내용 복사"
fi

