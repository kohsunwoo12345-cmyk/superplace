#!/bin/bash
# Cloudflare Pages Build Script - Final Version
# This script must be used as the Build command in Cloudflare Pages dashboard

set -e

echo "🚀 Step 1: Building with @cloudflare/next-on-pages..."
npx @cloudflare/next-on-pages

echo ""
echo "📦 Step 2: Copying .vercel/output/static to out/ directory..."
rm -rf out
cp -r .vercel/output/static out

echo ""
echo "✅ Step 3: Verifying build output..."
if [ -d "out" ]; then
  echo "✅ out/ directory exists"
  ls -la out/ | head -10
else
  echo "❌ ERROR: out/ directory not found!"
  exit 1
fi

echo ""
echo "📂 Step 4: Checking _worker.js..."
if [ -d "out/_worker.js" ]; then
  echo "✅ _worker.js directory exists"
  ls -la out/_worker.js/ | head -5
else
  echo "❌ ERROR: _worker.js directory not found!"
  exit 1
fi

echo ""
echo "🎉 Build complete! Ready for deployment."
