#!/bin/bash

# 🔧 Vectorize 인덱스 자동 재생성 스크립트
# 
# 이 스크립트는 Cloudflare API를 사용하여 Vectorize 인덱스를 재생성합니다.
# 
# 필요한 환경 변수:
# - CLOUDFLARE_ACCOUNT_ID: Cloudflare 계정 ID
# - CLOUDFLARE_API_TOKEN: Cloudflare API 토큰 (Vectorize 권한 필요)

set -e

echo "🔧 Vectorize Index Recreation Script"
echo "======================================"
echo ""

INDEX_NAME="knowledge-base-embeddings"
DIMENSIONS=1024
METRIC="cosine"

# 환경 변수 확인
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ CLOUDFLARE_ACCOUNT_ID 환경 변수가 설정되지 않았습니다."
    echo ""
    echo "📝 설정 방법:"
    echo "   export CLOUDFLARE_ACCOUNT_ID='your-account-id'"
    echo ""
    echo "🔍 계정 ID 찾기:"
    echo "   1. https://dash.cloudflare.com 접속"
    echo "   2. 오른쪽 사이드바에서 확인 (Account ID)"
    exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN 환경 변수가 설정되지 않았습니다."
    echo ""
    echo "📝 설정 방법:"
    echo "   export CLOUDFLARE_API_TOKEN='your-api-token'"
    echo ""
    echo "🔑 API 토큰 생성:"
    echo "   1. https://dash.cloudflare.com/profile/api-tokens"
    echo "   2. Create Token"
    echo "   3. 권한: Workers AI - Edit, Vectorize - Edit"
    exit 1
fi

echo "✅ 환경 변수 확인 완료"
echo "   Account ID: ${CLOUDFLARE_ACCOUNT_ID:0:10}..."
echo "   API Token: ${CLOUDFLARE_API_TOKEN:0:10}..."
echo ""

# 1. 기존 인덱스 확인
echo "🔍 기존 인덱스 확인..."
EXISTING_INDEX=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/vectorize/indexes/${INDEX_NAME}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.result.name' 2>/dev/null || echo "")

if [ -n "$EXISTING_INDEX" ] && [ "$EXISTING_INDEX" != "null" ]; then
    echo "✅ 기존 인덱스 발견: $EXISTING_INDEX"
    
    # 현재 차원 확인
    CURRENT_DIMENSIONS=$(curl -s -X GET \
      "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/vectorize/indexes/${INDEX_NAME}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.result.config.dimensions' 2>/dev/null || echo "0")
    
    echo "   현재 차원: ${CURRENT_DIMENSIONS}"
    
    if [ "$CURRENT_DIMENSIONS" = "$DIMENSIONS" ]; then
        echo "✅ 인덱스가 이미 올바른 차원($DIMENSIONS)으로 설정되어 있습니다!"
        exit 0
    fi
    
    echo ""
    echo "⚠️  현재 인덱스의 차원이 ${CURRENT_DIMENSIONS}이고 필요한 차원은 ${DIMENSIONS}입니다."
    echo "   인덱스를 삭제하고 재생성해야 합니다."
    echo ""
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 취소됨"
        exit 1
    fi
    
    # 2. 기존 인덱스 삭제
    echo ""
    echo "🗑️  기존 인덱스 삭제 중..."
    DELETE_RESULT=$(curl -s -X DELETE \
      "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/vectorize/indexes/${INDEX_NAME}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json")
    
    if echo "$DELETE_RESULT" | jq -e '.success' > /dev/null 2>&1; then
        echo "✅ 인덱스 삭제 완료"
    else
        echo "❌ 인덱스 삭제 실패:"
        echo "$DELETE_RESULT" | jq .
        exit 1
    fi
    
    echo "⏳ 삭제 처리 대기 (5초)..."
    sleep 5
else
    echo "ℹ️  기존 인덱스가 없습니다. 새로 생성합니다."
fi

# 3. 새 인덱스 생성
echo ""
echo "🆕 새 인덱스 생성 중..."
echo "   이름: $INDEX_NAME"
echo "   차원: $DIMENSIONS"
echo "   메트릭: $METRIC"

CREATE_RESULT=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/vectorize/indexes" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"${INDEX_NAME}\",
    \"config\": {
      \"dimensions\": ${DIMENSIONS},
      \"metric\": \"${METRIC}\"
    }
  }")

if echo "$CREATE_RESULT" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ 인덱스 생성 완료!"
    echo ""
    echo "📊 인덱스 정보:"
    echo "$CREATE_RESULT" | jq '.result'
    echo ""
    echo "✅ 완료! 이제 RAG 시스템을 테스트할 수 있습니다."
    echo ""
    echo "🧪 테스트 명령:"
    echo "   ./test-rag-production.sh"
else
    echo "❌ 인덱스 생성 실패:"
    echo "$CREATE_RESULT" | jq .
    exit 1
fi
