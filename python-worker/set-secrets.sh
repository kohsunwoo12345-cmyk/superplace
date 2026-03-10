#!/bin/bash

export CLOUDFLARE_API_TOKEN="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "🔐 Worker Secret 설정 중..."
echo ""

# GOOGLE_GEMINI_API_KEY 설정
echo "AIzaSyCYmFuwgNYx9pLL0WN9UR_GWRFDBXaER9o" | npx wrangler secret put GOOGLE_GEMINI_API_KEY

echo ""
echo "✅ Secret 설정 완료!"
