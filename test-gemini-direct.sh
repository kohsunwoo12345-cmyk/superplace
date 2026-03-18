#!/bin/bash

API_KEY="AIzaSyDiTHK0p3u0LGvQbmvZwRKaFXOwX4pJFqk"

echo "🧪 Gemini API 직접 테스트"
echo ""

curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [{"text": "안녕하세요! 간단히 인사해주세요."}]
      }
    ],
    "generationConfig": {
      "temperature": 0.7,
      "maxOutputTokens": 2048
    }
  }' | jq '.'
