#!/bin/bash

BASE_URL="https://3021-iftozwzhzim0qta6v3gft-0e616f0a.sandbox.novita.ai"

echo "🧪 SUPER PLACE AI Gems - 실제 API 테스트"
echo "=========================================="
echo ""

# Step 1: CSRF 토큰 가져오기
echo "📋 Step 1: CSRF 토큰 가져오기..."
CSRF_RESPONSE=$(curl -s -c cookies-live.txt "${BASE_URL}/api/auth/csrf")
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "✅ CSRF Token: ${CSRF_TOKEN:0:20}..."
echo ""

# Step 2: 로그인
echo "🔐 Step 2: 로그인..."
LOGIN_RESPONSE=$(curl -s -b cookies-live.txt -c cookies-live.txt \
  -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/json" \
  -d "{\"csrfToken\":\"${CSRF_TOKEN}\",\"email\":\"admin@superplace.com\",\"password\":\"admin123!@#\",\"json\":true}")
echo "✅ 로그인 응답: ${LOGIN_RESPONSE:0:100}..."
echo ""

# Step 3: 세션 확인
echo "👤 Step 3: 세션 확인..."
SESSION=$(curl -s -b cookies-live.txt "${BASE_URL}/api/auth/session")
echo "✅ 세션: ${SESSION:0:150}..."
echo ""

# Step 4: AI 챗봇 기본 테스트
echo "🤖 Step 4: AI 챗봇 기본 테스트..."
AI_RESPONSE_1=$(curl -s -b cookies-live.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"안녕하세요! 간단히 자기소개해주세요.","history":[]}')
echo "AI 응답 1:"
echo "$AI_RESPONSE_1" | jq -r '.response // .error // "응답 없음"' 2>/dev/null || echo "$AI_RESPONSE_1"
echo ""

# Step 5: 학습 도우미 Gem 테스트
echo "📚 Step 5: 학습 도우미 테스트..."
AI_RESPONSE_2=$(curl -s -b cookies-live.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"피타고라스 정리를 쉽게 설명해주세요.","history":[],"gemId":"study-helper"}')
echo "학습 도우미 응답:"
echo "$AI_RESPONSE_2" | jq -r '.response // .error // "응답 없음"' 2>/dev/null || echo "$AI_RESPONSE_2"
echo ""

# Step 6: 수학 튜터 Gem 테스트
echo "🔢 Step 6: 수학 튜터 테스트..."
AI_RESPONSE_3=$(curl -s -b cookies-live.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"2의 10승은 얼마인가요?","history":[],"gemId":"math-tutor"}')
echo "수학 튜터 응답:"
echo "$AI_RESPONSE_3" | jq -r '.response // .error // "응답 없음"' 2>/dev/null || echo "$AI_RESPONSE_3"
echo ""

# Step 7: 영어 회화 파트너 Gem 테스트
echo "🌍 Step 7: 영어 회화 파트너 테스트..."
AI_RESPONSE_4=$(curl -s -b cookies-live.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I introduce myself in English?","history":[],"gemId":"english-partner"}')
echo "영어 회화 파트너 응답:"
echo "$AI_RESPONSE_4" | jq -r '.response // .error // "응답 없음"' 2>/dev/null || echo "$AI_RESPONSE_4"
echo ""

echo "=========================================="
echo "✅ 실제 API 테스트 완료!"
echo ""
echo "🌐 브라우저 테스트 URL:"
echo "   ${BASE_URL}/dashboard/ai-gems"
echo ""
echo "🔑 로그인 정보:"
echo "   이메일: admin@superplace.com"
echo "   비밀번호: admin123!@#"
echo ""
