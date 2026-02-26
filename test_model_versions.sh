#!/bin/bash

echo "🧪 Testing Gemini 1.5 model version variations..."
echo ""

API_ENDPOINT="https://superplacestudy.pages.dev/api/ai/chat"

# Test different variations of 1.5 models
MODELS=(
  "gemini-1.5-flash"
  "gemini-1.5-flash-latest"
  "gemini-1.5-flash-001"
  "gemini-1.5-flash-002"
  "gemini-1.5-pro"
  "gemini-1.5-pro-latest"
  "gemini-1.5-pro-001"
  "gemini-1.5-pro-002"
)

for MODEL in "${MODELS[@]}"; do
  echo "Testing: $MODEL"
  RESPONSE=$(curl -s -X POST "$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"Hi\",
      \"model\": \"$MODEL\",
      \"temperature\": 0.7,
      \"maxTokens\": 100
    }")
  
  if echo "$RESPONSE" | grep -q '"text"'; then
    echo "✅ SUCCESS: $MODEL"
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.details' 2>/dev/null | grep -o 'models/[^ ]*' | head -1)
    echo "❌ FAILED: $ERROR"
  fi
  echo ""
  sleep 0.5
done
