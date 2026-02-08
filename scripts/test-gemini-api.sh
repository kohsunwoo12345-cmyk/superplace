#!/bin/bash

# Gemini API 환경 변수 테스트 스크립트

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "════════════════════════════════════════════════════════════"
echo "   🧪 Gemini API 환경 변수 테스트"
echo "════════════════════════════════════════════════════════════"
echo ""

# 테스트 1: 환경 변수 존재 여부
echo "1️⃣  환경 변수 존재 여부 확인..."
ENV_RESULT=$(curl -s "${BASE_URL}/api/test-env")
echo "$ENV_RESULT" | jq '.'

HAS_KEY=$(echo "$ENV_RESULT" | jq -r '.hasKey')
KEY_LENGTH=$(echo "$ENV_RESULT" | jq -r '.keyLength')

echo ""
if [ "$HAS_KEY" = "true" ]; then
  echo "✅ 환경 변수 설정됨 (길이: ${KEY_LENGTH}자)"
else
  echo "❌ 환경 변수 설정 안 됨"
  echo ""
  echo "📝 해결 방법:"
  echo "   1. Cloudflare Dashboard > Settings > Environment variables"
  echo "   2. Preview 탭에서 GOOGLE_GEMINI_API_KEY 추가"
  echo "   3. Deployments 탭에서 'Retry deployment'"
  exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"

# 테스트 2: Gemini API 작동 여부
echo "2️⃣  Gemini API 호출 테스트..."
API_RESULT=$(curl -s -X POST "${BASE_URL}/api/ai/chat" \
  -H 'Content-Type: application/json' \
  -d '{"message": "안녕하세요, 간단히 인사해주세요", "model": "gemini-2.5-flash"}')

echo "$API_RESULT" | jq '.'

ERROR=$(echo "$API_RESULT" | jq -r '.error // empty')

echo ""
if [ -n "$ERROR" ]; then
  echo "❌ Gemini API 호출 실패"
  echo "   오류: $ERROR"
  exit 1
else
  RESPONSE=$(echo "$API_RESULT" | jq -r '.response // empty')
  if [ -n "$RESPONSE" ]; then
    echo "✅ Gemini API 작동 확인!"
    echo "   응답: ${RESPONSE:0:50}..."
  else
    echo "⚠️  응답 형식이 예상과 다름"
  fi
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "   🎉 모든 테스트 완료!"
echo "════════════════════════════════════════════════════════════"
