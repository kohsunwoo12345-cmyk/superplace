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
  cp -r functions out/functions
  echo "✅ Functions copied to out/functions/"
  ls -la out/functions/ | head -10
else
  echo "⚠️  WARNING: functions directory not found!"
fi

# Verify functions directory in output
if [ -d "out/functions" ]; then
  echo "✅ out/functions directory exists"
  echo "📁 Functions structure:"
  find out/functions -type f | head -10
else
  echo "❌ ERROR: out/functions directory not found!"
  exit 1
fi

echo "🎉 Cloudflare Pages build complete!"
echo "📊 Build summary:"
echo "  - Static pages: out/"
echo "  - API functions: out/functions/"
echo "  - Ready for deployment!"
