#!/bin/bash

BASE_URL="https://superplace-study.vercel.app"

echo "🔍 프로덕션 API 오류 테스트"
echo "=========================================="
echo ""

# Step 1: CSRF 토큰 가져오기
echo "📋 Step 1: CSRF 토큰 가져오기..."
CSRF_RESPONSE=$(curl -s -c cookies-prod-test.txt "${BASE_URL}/api/auth/csrf")
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "✅ CSRF Token: ${CSRF_TOKEN:0:20}..."
echo ""

# Step 2: 로그인
echo "🔐 Step 2: 로그인..."
LOGIN_RESPONSE=$(curl -s -b cookies-prod-test.txt -c cookies-prod-test.txt \
  -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/json" \
  -d "{\"csrfToken\":\"${CSRF_TOKEN}\",\"email\":\"admin@superplace.com\",\"password\":\"admin123!@#\",\"json\":true}")
echo "✅ 로그인 완료"
echo ""

# Step 3: AI 챗봇 테스트 (자세한 오류 확인)
echo "🤖 Step 3: AI API 테스트 (상세)..."
AI_RESPONSE=$(curl -s -b cookies-prod-test.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"안녕하세요","history":[]}')

echo "📥 전체 응답:"
echo "$AI_RESPONSE" | jq '.' 2>/dev/null || echo "$AI_RESPONSE"
echo ""

# Step 4: 에러 필드 추출
echo "🔍 Step 4: 에러 분석..."
ERROR=$(echo "$AI_RESPONSE" | jq -r '.error // "없음"' 2>/dev/null)
DETAILS=$(echo "$AI_RESPONSE" | jq -r '.details // "없음"' 2>/dev/null)

echo "Error: $ERROR"
echo "Details: $DETAILS"
echo ""

# Step 5: 다른 Gem으로도 테스트
echo "📚 Step 5: 학습 도우미 Gem 테스트..."
AI_RESPONSE_2=$(curl -s -b cookies-prod-test.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"피타고라스 정리를 설명해주세요","history":[],"gemId":"study-helper"}')

echo "📥 학습 도우미 응답:"
echo "$AI_RESPONSE_2" | jq '.' 2>/dev/null || echo "$AI_RESPONSE_2"
echo ""

echo "=========================================="
