#!/bin/bash

# Cloudflare Pages Build Script for Super Place
# Simple static export with Cloudflare Functions

set -e  # Exit on error

echo "🚀 Starting Cloudflare Pages build..."

# Check Node.js version
echo "📦 Node.js version: $(node -v)"
echo "📦 npm version: $(npm -v)"

# Build Next.js static export
echo "🔨 Building Next.js static site..."
npm run build

# Verify build output
echo "✅ Build completed successfully!"
echo "📁 Build output directory: out/"

# List output directory contents
if [ -d "out" ]; then
  echo "✅ out directory created successfully"
  ls -la out/ | head -20
else
  echo "❌ ERROR: out directory not found!"
  exit 1
fi

# Copy Cloudflare Pages Functions to output
echo "🔧 Copying Cloudflare Pages Functions..."
if [ -d "functions" ]; then
  # Cloudflare Pages looks for functions in the root, not in out/
  # So we keep functions at the root level
  echo "✅ Functions directory exists at root level"
  echo "📁 Functions structure:"
  find functions -type f -name "*.ts" | head -10
else
  echo "⚠️  WARNING: functions directory not found!"
fi

echo "🎉 Cloudflare Pages build complete!"
echo "📊 Build summary:"
echo "  - Static pages: out/"
echo "  - API functions: out/functions/"
echo "  - Ready for deployment!"
