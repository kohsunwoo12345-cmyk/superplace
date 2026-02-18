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
ls -la out/
