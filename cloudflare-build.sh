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

# Build Next.js application
echo "🔨 Building Next.js application..."
npm run build

# Verify build output
echo "✅ Build completed successfully!"
echo "📁 Build output directory: out/"

# List output directory contents
ls -la out/ || echo "Warning: out directory not found"

echo "🎉 Cloudflare Pages build complete!"
