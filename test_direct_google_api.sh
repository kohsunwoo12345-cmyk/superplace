#!/bin/bash

echo "🧪 Testing direct Google Gemini API calls..."
echo ""

# These models should work according to Google docs
MODELS=(
  "gemini-2.0-flash-exp"
  "gemini-1.5-flash"
  "gemini-1.5-pro"
  "gemini-1.0-pro"
)

for MODEL in "${MODELS[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Testing: $MODEL"
  
  # Try v1beta
  echo "  API: v1beta"
  STATUS_BETA=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=YOUR_KEY_HERE" \
    -H "Content-Type: application/json" \
    -d '{"contents":[{"parts":[{"text":"hi"}]}]}' 2>&1 || echo "000")
  echo "    Status: $STATUS_BETA"
  
  # Try v1
  echo "  API: v1"
  STATUS_V1=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    "https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=YOUR_KEY_HERE" \
    -H "Content-Type: application/json" \
    -d '{"contents":[{"parts":[{"text":"hi"}]}]}' 2>&1 || echo "000")
  echo "    Status: $STATUS_V1"
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "NOTE: This test doesn't use real API key, just checks endpoint format"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
