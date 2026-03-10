#!/bin/bash

echo "🚀 Wrangler를 통한 Worker 배포 시작..."
echo ""

# Wrangler 로그인 확인 (API 토큰 사용)
export CLOUDFLARE_API_TOKEN="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "📋 현재 wrangler.toml 설정:"
cat wrangler.toml
echo ""
echo ""

echo "📤 Worker 배포 중..."
npx wrangler deploy

echo ""
echo "✅ Worker 배포 완료!"
echo ""
echo "🌐 Worker URL: https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
echo ""
echo "📊 바인딩 확인:"
echo "  - AI: Cloudflare AI (계정 ID: 117379ce5c9d9af026b16c9cf21b10d5)"
echo "  - VECTORIZE: knowledge-base-embeddings (1024차원)"
echo "  - DB: superplace-db (8c106540-21b4-4fa9-8879-c4956e459ca1)"
echo "  - R2_DOCUMENTS: superplace-documents"
echo "  - R2_SUPERPLACESTUDY: superplacestudy"
