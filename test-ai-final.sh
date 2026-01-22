#!/bin/bash

echo "=== AI 챗봇 최종 테스트 ==="
echo ""

BASE_URL="https://3017-iftozwzhzim0qta6v3gft-0e616f0a.sandbox.novita.ai"

echo "Step 1: CSRF 토큰 가져오기..."
CSRF_RESPONSE=$(curl -s -c cookies-final-ai.txt "${BASE_URL}/api/auth/csrf")
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "✓ CSRF Token 획득"
echo ""

echo "Step 2: 관리자 로그인..."
curl -s -b cookies-final-ai.txt -c cookies-final-ai.txt \
  -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=${CSRF_TOKEN}&email=admin@superplace.com&password=admin123!@%23&callbackUrl=${BASE_URL}/dashboard" > /dev/null
echo "✓ 로그인 완료"
echo ""

echo "Step 3: AI 챗봇 테스트 1 - 자기소개"
echo "질문: 안녕하세요! 당신은 누구인가요?"
AI_RESPONSE=$(curl -s -b cookies-final-ai.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"안녕하세요! 당신은 누구인가요?", "history":[]}')

echo ""
echo "AI 응답:"
echo "$AI_RESPONSE" | jq -r '.response' 2>/dev/null || echo "$AI_RESPONSE"
echo ""
echo "---"

echo ""
echo "Step 4: AI 챗봇 테스트 2 - 수학"
echo "질문: 2+2는 얼마인가요?"
AI_RESPONSE2=$(curl -s -b cookies-final-ai.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"2+2는 얼마인가요?", "history":[]}')

echo ""
echo "AI 응답:"
echo "$AI_RESPONSE2" | jq -r '.response' 2>/dev/null || echo "$AI_RESPONSE2"
echo ""
echo "---"

echo ""
echo "Step 5: AI 챗봇 테스트 3 - 학습 도움"
echo "질문: 피타고라스 정리를 간단히 설명해주세요."
AI_RESPONSE3=$(curl -s -b cookies-final-ai.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"피타고라스 정리를 간단히 설명해주세요.", "history":[]}')

echo ""
echo "AI 응답:"
echo "$AI_RESPONSE3" | jq -r '.response' 2>/dev/null || echo "$AI_RESPONSE3"
echo ""
echo "---"

echo ""
echo "Step 6: AI 챗봇 테스트 4 - 한국어 이해"
echo "질문: 한국의 수도는 어디인가요?"
AI_RESPONSE4=$(curl -s -b cookies-final-ai.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"한국의 수도는 어디인가요?", "history":[]}')

echo ""
echo "AI 응답:"
echo "$AI_RESPONSE4" | jq -r '.response' 2>/dev/null || echo "$AI_RESPONSE4"
echo ""

echo "==================================="
echo "✅ AI 챗봇 테스트 완료!"
echo "==================================="
echo ""
echo "📱 브라우저에서 테스트:"
echo "   URL: ${BASE_URL}/dashboard/ai-chatbot"
echo "   로그인: admin@superplace.com / admin123!@#"
echo ""
