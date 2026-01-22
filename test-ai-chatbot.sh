#!/bin/bash

echo "=== AI 챗봇 테스트 시작 ==="
echo ""

BASE_URL="https://3014-iftozwzhzim0qta6v3gft-0e616f0a.sandbox.novita.ai"

echo "Step 1: CSRF 토큰 가져오기..."
CSRF_RESPONSE=$(curl -s -c cookies-ai.txt "${BASE_URL}/api/auth/csrf")
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "CSRF Token: ${CSRF_TOKEN:0:20}..."
echo ""

echo "Step 2: 관리자 로그인..."
LOGIN_RESPONSE=$(curl -s -b cookies-ai.txt -c cookies-ai.txt \
  -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=${CSRF_TOKEN}&email=admin@superplace.com&password=admin123!@%23&callbackUrl=${BASE_URL}/dashboard")

echo "Login successful!"
echo ""

echo "Step 3: 세션 확인..."
SESSION_RESPONSE=$(curl -s -b cookies-ai.txt "${BASE_URL}/api/auth/session")
echo "Session: ${SESSION_RESPONSE:0:100}..."
echo ""

echo "Step 4: AI 챗봇 페이지 접속..."
PAGE_RESPONSE=$(curl -s -b cookies-ai.txt "${BASE_URL}/dashboard/ai-chatbot" | grep -o "AI 챗봇")
echo "페이지 로드: $PAGE_RESPONSE"
echo ""

echo "Step 5: AI 챗봇 API 테스트..."
echo "질문: 안녕하세요! 자기소개를 해주세요."
AI_RESPONSE=$(curl -s -b cookies-ai.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"안녕하세요! 자기소개를 해주세요.", "history":[]}')

echo ""
echo "AI 응답:"
echo "$AI_RESPONSE" | jq -r '.response' 2>/dev/null || echo "$AI_RESPONSE"
echo ""

echo "Step 6: 두 번째 질문 테스트..."
echo "질문: 2+2는 얼마인가요?"
AI_RESPONSE2=$(curl -s -b cookies-ai.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"2+2는 얼마인가요?", "history":[]}')

echo ""
echo "AI 응답:"
echo "$AI_RESPONSE2" | jq -r '.response' 2>/dev/null || echo "$AI_RESPONSE2"
echo ""

echo "Step 7: 수학 문제 테스트..."
echo "질문: 피타고라스 정리를 설명해주세요."
AI_RESPONSE3=$(curl -s -b cookies-ai.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"피타고라스 정리를 설명해주세요.", "history":[]}')

echo ""
echo "AI 응답:"
echo "$AI_RESPONSE3" | jq -r '.response' 2>/dev/null || echo "$AI_RESPONSE3"
echo ""

echo "=== AI 챗봇 테스트 완료 ==="
echo ""
echo "접속 URL: ${BASE_URL}/dashboard/ai-chatbot"
echo "로그인: admin@superplace.com / admin123!@#"
