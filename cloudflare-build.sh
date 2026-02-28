#!/bin/bash

# Cloudflare Pages Build Script for Super Place
# Uses @cloudflare/next-on-pages for Next.js with API Routes support

set -e  # Exit on error

echo "🚀 Starting Cloudflare Pages build with @cloudflare/next-on-pages..."

# Check Node.js version
echo "📦 Node.js version: $(node -v)"
echo "📦 npm version: $(npm -v)"

# Build with @cloudflare/next-on-pages
echo "🔨 Building Next.js with Cloudflare Pages adapter..."
npm run pages:build

# Verify build output
echo "✅ Build completed successfully!"
echo "📁 Build output directory: .vercel/output/static/"

# List output directory contents
if [ -d ".vercel/output/static" ]; then
  echo "✅ .vercel/output/static directory created successfully"
  ls -la .vercel/output/static/ | head -20
  
  # Check for worker file
  if [ -f ".vercel/output/static/_worker.js/index.js" ]; then
    echo "✅ Cloudflare Worker file generated"
  fi
  
  # Copy to 'out' directory for Cloudflare Pages compatibility
  echo "📦 Copying build output to 'out' directory for Cloudflare Pages..."
  rm -rf out
  cp -r .vercel/output/static out
  echo "✅ Build output copied to 'out' directory"
else
  echo "❌ ERROR: .vercel/output/static directory not found!"
  exit 1
fi

echo "🎉 Cloudflare Pages build complete!"
echo "📊 Build summary:"
echo "  - Build output: .vercel/output/static/"
echo "  - Deployment output: out/ (copied from .vercel/output/static/)"
echo "  - API Routes: Converted to Cloudflare Workers"
echo "  - Ready for deployment!"
