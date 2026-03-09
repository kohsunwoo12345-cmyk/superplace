#!/bin/bash

# 🧪 RAG System Production Test Script
# 프로덕션 환경에서 RAG 시스템 테스트

set -e

PRODUCTION_URL="https://superplacestudy.pages.dev"

echo "🚀 Starting RAG System Production Test..."
echo "======================================"
echo "🌐 Testing against: $PRODUCTION_URL"
echo ""

# Run tests against production
TEST_BASE_URL="$PRODUCTION_URL" npx tsx test-rag-system.ts

echo ""
echo "✅ Production test complete!"
