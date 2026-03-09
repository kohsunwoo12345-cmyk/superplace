#!/bin/bash

# 🧪 RAG System Local Test Script
# 로컬에서 wrangler dev로 RAG 시스템 테스트

set -e

echo "🚀 Starting RAG System Local Test..."
echo "======================================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler not found. Installing..."
    npm install -g wrangler
fi

echo ""
echo "📦 Building Next.js application..."
cd /home/user/webapp
npm run build

echo ""
echo "🔧 Starting wrangler dev server..."
# Start wrangler dev in background
wrangler pages dev ./out --port 8788 --compatibility-date=2024-09-23 &
WRANGLER_PID=$!

echo "⏳ Waiting for server to start (15 seconds)..."
sleep 15

echo ""
echo "🧪 Running integration tests..."
# Run tests against local server
TEST_BASE_URL="http://localhost:8788" npx tsx test-rag-system.ts

# Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $WRANGLER_PID 2>/dev/null || true

echo ""
echo "✅ Local test complete!"
