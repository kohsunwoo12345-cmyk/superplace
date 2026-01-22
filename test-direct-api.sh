#!/bin/bash

API_KEY="YOUR_API_KEY_HERE"

echo "🔍 Google Gemini API 직접 호출 테스트"
echo "=========================================="
echo ""

# 테스트할 모델 리스트
MODELS=(
  "gemini-1.5-flash"
  "gemini-1.5-pro"
  "gemini-pro"
  "gemini-2.0-flash-exp"
  "gemini-1.5-flash-latest"
)

for MODEL in "${MODELS[@]}"; do
  echo "Testing: $MODEL"
  
  RESPONSE=$(curl -s -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
      "contents": [{
        "parts": [{"text": "Say hello"}]
      }]
    }')
  
  # 응답 확인
  if echo "$RESPONSE" | grep -q "candidates"; then
    echo "  ✅ 작동! 응답:"
    echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].text' 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "🎯 사용 가능한 모델: $MODEL"
    break
  elif echo "$RESPONSE" | grep -q "404"; then
    echo "  ❌ 404 Not Found"
  elif echo "$RESPONSE" | grep -q "API key"; then
    echo "  ❌ API 키 오류"
    echo "  상세: $(echo "$RESPONSE" | jq -r '.error.message' 2>/dev/null)"
    break
  else
    echo "  ❌ 오류"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  fi
  echo ""
done

echo "=========================================="
echo ""
echo "⚠️ 주의: 위 스크립트에서 YOUR_API_KEY_HERE를 실제 API 키로 교체하세요"
