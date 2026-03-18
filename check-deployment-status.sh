#!/bin/bash

echo "🔍 Cloudflare Pages 배포 상태 확인"
echo "===================================="

# 1. 로컬 빌드 파일 확인
echo ""
echo "📁 1. 로컬 빌드 파일 확인"
echo "-----------------------------------"
if [ -f "out/functions/api/ai-chat.js" ]; then
  echo "✅ ai-chat.js 존재"
  echo ""
  echo "System Prompt 관련 코드 확인:"
  grep -A 5 "시스템 지침" out/functions/api/ai-chat.js | head -10
else
  echo "❌ ai-chat.js 없음"
fi

# 2. Git 상태 확인
echo ""
echo "📊 2. Git 상태"
echo "-----------------------------------"
git log --oneline -3
echo ""
git status

# 3. 실제 API 테스트 (다양한 시나리오)
echo ""
echo "🧪 3. 실제 API 테스트"
echo "-----------------------------------"

# 테스트 1: 간단한 질문
echo ""
echo "Test 1: 기본 역할 확인"
RESPONSE=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕",
    "botId": "bot-1773803533575-qrn2pluec",
    "userId": "student-test-001",
    "conversationHistory": []
  }')

echo "$RESPONSE" | jq '.'

# 응답 분석
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  AI_RESPONSE=$(echo "$RESPONSE" | jq -r '.response')
  
  if echo "$AI_RESPONSE" | grep -qi "꾸메땅학원\|단어.*암기\|스피드.*체커"; then
    echo "✅ System Prompt 정상 적용됨"
  else
    echo "❌ System Prompt 미적용 - 응답:"
    echo "$AI_RESPONSE"
  fi
else
  echo "❌ API 호출 실패"
fi

# 테스트 2: 대화 히스토리 포함
echo ""
echo "Test 2: 대화 히스토리 포함 테스트"
RESPONSE2=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "너는 누구야?",
    "botId": "bot-1773803533575-qrn2pluec",
    "userId": "student-test-002",
    "conversationHistory": [
      {"role": "user", "parts": [{"text": "안녕"}]},
      {"role": "model", "parts": [{"text": "안녕하세요!"}]}
    ]
  }')

echo "$RESPONSE2" | jq -r '.response' | head -c 200

echo ""
echo ""
echo "===================================="
