#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Vectorize 인덱스 생성 방법 (API 사용)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Step 1: Cloudflare API Token 생성"
echo "   1. https://dash.cloudflare.com/profile/api-tokens 접속"
echo "   2. 'Create Token' 클릭"
echo "   3. 'Edit Cloudflare Workers' 템플릿 선택"
echo "   4. Permissions 추가:"
echo "      • Account / Vectorize / Edit"
echo "   5. 'Continue to summary' → 'Create Token'"
echo "   6. 토큰 복사 (한 번만 표시됨!)"
echo ""
echo "✅ Step 2: Account ID 확인"
echo "   1. https://dash.cloudflare.com/ 접속"
echo "   2. 왼쪽 메뉴에서 'Workers & Pages' 클릭"
echo "   3. 오른쪽에 Account ID가 표시됨"
echo ""
echo "✅ Step 3: API로 인덱스 생성"
echo "   터미널에서 다음 명령 실행:"
echo ""
cat << 'API_EXAMPLE'
export CLOUDFLARE_API_TOKEN="your-api-token-here"
export CLOUDFLARE_ACCOUNT_ID="your-account-id-here"

curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/vectorize/indexes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "knowledge-base-embeddings",
    "config": {
      "dimensions": 768,
      "metric": "cosine"
    }
  }'
API_EXAMPLE
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 중요: 토큰과 Account ID를 알려주시면 제가 직접 생성하겠습니다!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
