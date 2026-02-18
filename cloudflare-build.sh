#!/bin/bash

# Cloudflare Pages Build Script for Super Place
# This script builds the Next.js application for Cloudflare Pages deployment

set -e  # Exit on error

echo "🚀 Starting Cloudflare Pages build..."

# Check Node.js version
echo "📦 Node.js version: $(node -v)"
echo "📦 npm version: $(npm -v)"

# Install dependencies (should already be done by Cloudflare)
echo "📥 Dependencies already installed by Cloudflare"

# Build with @cloudflare/next-on-pages
echo "🔨 Building with @cloudflare/next-on-pages..."
npx @cloudflare/next-on-pages

# Create out directory from .vercel/output/static
echo "📦 Creating out directory..."
rm -rf out
cp -r .vercel/output/static out

# 🔧 CRITICAL: Copy Cloudflare Pages Functions
echo "🔧 Copying Cloudflare Pages Functions..."
if [ -d "functions" ]; then
  cp -r functions out/functions
  echo "✅ Functions copied to out/functions/"
  ls -la out/functions/ | head -10
else
  echo "⚠️  WARNING: functions directory not found!"
fi

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

# Verify functions directory in output
if [ -d "out/functions" ]; then
  echo "✅ out/functions directory exists"
  echo "📁 Functions structure:"
  find out/functions -type f | head -10
else
  echo "⚠️  WARNING: out/functions directory not found!"
fi

echo "🎉 Cloudflare Pages build complete!"
