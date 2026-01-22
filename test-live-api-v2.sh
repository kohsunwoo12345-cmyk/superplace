#!/bin/bash

BASE_URL="https://3022-iftozwzhzim0qta6v3gft-0e616f0a.sandbox.novita.ai"

echo "🧪 SUPER PLACE AI Gems - 실제 API 테스트 (수정 버전)"
echo "=========================================="
echo ""

# Step 1: CSRF 토큰 가져오기
echo "📋 Step 1: CSRF 토큰 가져오기..."
CSRF_RESPONSE=$(curl -s -c cookies-live2.txt "${BASE_URL}/api/auth/csrf")
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "✅ CSRF Token: ${CSRF_TOKEN:0:20}..."
echo ""

# Step 2: 로그인
echo "🔐 Step 2: 로그인..."
LOGIN_RESPONSE=$(curl -s -b cookies-live2.txt -c cookies-live2.txt \
  -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/json" \
  -d "{\"csrfToken\":\"${CSRF_TOKEN}\",\"email\":\"admin@superplace.com\",\"password\":\"admin123!@#\",\"json\":true}")
echo "✅ 로그인 완료"
echo ""

# Step 3: AI 챗봇 기본 테스트
echo "🤖 Step 3: AI 챗봇 테스트 (기본)..."
AI_RESPONSE_1=$(curl -s -b cookies-live2.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"안녕하세요! 간단히 자기소개해주세요. 한 문장으로 부탁합니다.","history":[]}')
echo "📤 요청: 안녕하세요! 간단히 자기소개해주세요."
echo "📥 응답:"
echo "$AI_RESPONSE_1" | jq -r '.response // .error // "ERROR: 응답 없음"' 2>/dev/null || echo "$AI_RESPONSE_1"
echo ""
echo "---"
echo ""

# Step 4: 학습 도우미 Gem 테스트
echo "📚 Step 4: 학습 도우미 Gem 테스트..."
AI_RESPONSE_2=$(curl -s -b cookies-live2.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"피타고라스 정리를 한 줄로 설명해주세요.","history":[],"gemId":"study-helper"}')
echo "📤 요청: 피타고라스 정리를 한 줄로 설명해주세요."
echo "📥 학습 도우미 응답:"
echo "$AI_RESPONSE_2" | jq -r '.response // .error // "ERROR: 응답 없음"' 2>/dev/null || echo "$AI_RESPONSE_2"
echo ""
echo "---"
echo ""

# Step 5: 수학 튜터 Gem 테스트
echo "🔢 Step 5: 수학 튜터 Gem 테스트..."
AI_RESPONSE_3=$(curl -s -b cookies-live2.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"2의 10승은 얼마인가요?","history":[],"gemId":"math-tutor"}')
echo "📤 요청: 2의 10승은 얼마인가요?"
echo "📥 수학 튜터 응답:"
echo "$AI_RESPONSE_3" | jq -r '.response // .error // "ERROR: 응답 없음"' 2>/dev/null || echo "$AI_RESPONSE_3"
echo ""
echo "---"
echo ""

# Step 6: 영어 회화 파트너 Gem 테스트
echo "🌍 Step 6: 영어 회화 파트너 Gem 테스트..."
AI_RESPONSE_4=$(curl -s -b cookies-live2.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I say hello in Korean?","history":[],"gemId":"english-partner"}')
echo "📤 요청: How do I say hello in Korean?"
echo "📥 영어 회화 파트너 응답:"
echo "$AI_RESPONSE_4" | jq -r '.response // .error // "ERROR: 응답 없음"' 2>/dev/null || echo "$AI_RESPONSE_4"
echo ""
echo "---"
echo ""

# Step 7: 글쓰기 코치 Gem 테스트
echo "✍️ Step 7: 글쓰기 코치 Gem 테스트..."
AI_RESPONSE_5=$(curl -s -b cookies-live2.txt \
  -X POST "${BASE_URL}/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"좋은 문장을 쓰는 팁을 한 가지만 알려주세요.","history":[],"gemId":"writing-coach"}')
echo "📤 요청: 좋은 문장을 쓰는 팁을 한 가지만 알려주세요."
echo "📥 글쓰기 코치 응답:"
echo "$AI_RESPONSE_5" | jq -r '.response // .error // "ERROR: 응답 없음"' 2>/dev/null || echo "$AI_RESPONSE_5"
echo ""

echo "=========================================="
echo "✅ 실제 API 테스트 완료!"
echo ""
echo "🌐 브라우저 테스트 링크:"
echo ""
echo "1️⃣  AI Gems 선택 페이지:"
echo "    ${BASE_URL}/dashboard/ai-gems"
echo ""
echo "2️⃣  개별 Gem 테스트 페이지:"
echo "    📚 학습 도우미: ${BASE_URL}/dashboard/ai-gems/study-helper"
echo "    ✍️  글쓰기 코치: ${BASE_URL}/dashboard/ai-gems/writing-coach"
echo "    🔢 수학 튜터: ${BASE_URL}/dashboard/ai-gems/math-tutor"
echo "    🌍 영어 회화: ${BASE_URL}/dashboard/ai-gems/english-partner"
echo "    🔬 과학 실험실: ${BASE_URL}/dashboard/ai-gems/science-lab"
echo "    🎨 창의력 메이커: ${BASE_URL}/dashboard/ai-gems/creative-maker"
echo "    💼 진로 상담사: ${BASE_URL}/dashboard/ai-gems/career-counselor"
echo "    💝 멘탈 코치: ${BASE_URL}/dashboard/ai-gems/mental-coach"
echo ""
echo "3️⃣  기본 AI 챗봇:"
echo "    ${BASE_URL}/dashboard/ai-chatbot"
echo ""
echo "🔑 로그인 정보:"
echo "   이메일: admin@superplace.com"
echo "   비밀번호: admin123!@#"
echo ""
