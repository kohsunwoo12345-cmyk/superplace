#!/bin/bash

# Cloudflare Pages Build Script for Super Place
# Static export + Cloudflare Functions

set -e  # Exit on error

echo "🚀 Starting Cloudflare Pages build..."

# Check Node.js version
echo "📦 Node.js version: $(node -v)"
echo "📦 npm version: $(npm -v)"

# Build Next.js with static export
echo "🔨 Building Next.js static site..."
npm run build

# Verify build output
if [ -d "out" ]; then
  echo "✅ Static build output created: out/"
  ls -la out/ | head -20
else
  echo "❌ ERROR: out directory not found!"
  exit 1
fi

# Verify functions directory
if [ -d "functions" ]; then
  echo "✅ Cloudflare Functions directory exists"
  echo "📁 API endpoints:"
  find functions/api/kakao -type f -name "*.ts" | head -10
else
  echo "⚠️  WARNING: functions directory not found!"
fi

echo "🎉 Cloudflare Pages build complete!"
echo "📊 Build summary:"
echo "  - Static pages: out/"
echo "  - API functions: functions/"
echo "  - Ready for deployment!"
