#!/bin/bash
# Cloudflare Pages Build Script
# This script runs @cloudflare/next-on-pages and copies output to 'out' directory

set -e

echo "🚀 Building with @cloudflare/next-on-pages..."
npx @cloudflare/next-on-pages

echo "📦 Copying build output to 'out' directory..."
rm -rf out
cp -r .vercel/output/static out

echo "✅ Build complete! Output is in 'out' directory"
ls -la out/ | head -20

echo "📂 Checking _worker.js..."
if [ -d "out/_worker.js" ]; then
  echo "✅ _worker.js directory exists"
  ls -la out/_worker.js/
else
  echo "❌ _worker.js directory not found"
fi
