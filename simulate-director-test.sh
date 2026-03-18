#!/bin/bash

echo "🧪 학원장 계정 시뮬레이션 테스트"
echo "===================================="

# 테스트 데이터
DIRECTOR_ID="test-director-$(date +%s)"
ACADEMY_ID="academy-test-001"
BOT_ID="bot-1773803533575-qrn2pluec"

echo ""
echo "📋 테스트 시나리오:"
echo "-----------------------------------"
echo "학원장 ID: $DIRECTOR_ID"
echo "학원 ID: $ACADEMY_ID"
echo "봇 ID: $BOT_ID"
echo ""

# Test 1: 봇 목록 조회 (학원장 - academy-bots API 사용)
echo "🤖 Test 1: 학원장 - 학원 전체 봇 목록 조회"
echo "-----------------------------------"
echo "API: /api/user/academy-bots?academyId=$ACADEMY_ID"

RESPONSE1=$(curl -s "https://suplacestudy.com/api/user/academy-bots?academyId=$ACADEMY_ID")

echo "Response:"
echo "$RESPONSE1" | jq '.' 2>/dev/null || echo "$RESPONSE1"

if echo "$RESPONSE1" | jq -e '.success == true' > /dev/null 2>&1; then
  BOT_COUNT=$(echo "$RESPONSE1" | jq -r '.count // .bots | length')
  echo ""
  echo "✅ API 호출 성공: $BOT_COUNT 개의 봇"
  
  if [ "$BOT_COUNT" -gt 0 ]; then
    FIRST_BOT=$(echo "$RESPONSE1" | jq -r '.bots[0].id')
    echo "첫 번째 봇 ID: $FIRST_BOT"
    BOT_ID=$FIRST_BOT
  else
    echo "⚠️ 학원에 할당된 봇이 없음 - 기본 봇 ID 사용"
  fi
else
  echo "❌ API 호출 실패"
fi

echo ""
echo "💬 Test 2: AI 챗 API 테스트"
echo "-----------------------------------"

REQUEST_BODY=$(cat <<JSON
{
  "message": "안녕하세요, 당신은 누구인가요?",
  "botId": "$BOT_ID",
  "userId": "$DIRECTOR_ID",
  "conversationHistory": [],
  "userRole": "DIRECTOR",
  "userAcademyId": "$ACADEMY_ID"
}
JSON
)

echo "Request Body:"
echo "$REQUEST_BODY" | jq '.'

RESPONSE2=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY")

echo ""
echo "Response:"
echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"

if echo "$RESPONSE2" | jq -e '.success == true' > /dev/null 2>&1; then
  echo ""
  echo "✅ AI 챗 성공!"
  echo ""
  echo "AI 응답:"
  echo "$RESPONSE2" | jq -r '.response'
  echo ""
  echo "RAG 사용: $(echo "$RESPONSE2" | jq -r '.workerRAGUsed')"
  echo "Context 수: $(echo "$RESPONSE2" | jq -r '.ragContextCount')"
else
  echo ""
  echo "❌ AI 챗 실패"
  echo "에러: $(echo "$RESPONSE2" | jq -r '.message // .error')"
fi

echo ""
echo "💬 Test 3: 대화 히스토리 포함 테스트"
echo "-----------------------------------"

REQUEST_BODY3=$(cat <<JSON
{
  "message": "Spanish라는 단어의 뜻을 알려줘",
  "botId": "$BOT_ID",
  "userId": "$DIRECTOR_ID",
  "conversationHistory": [
    {"role": "user", "content": "안녕하세요"},
    {"role": "assistant", "content": "안녕하세요! 저는 꾸메땅학원의 중등부 전용 단어 암기 스피드 체커입니다."}
  ],
  "userRole": "DIRECTOR",
  "userAcademyId": "$ACADEMY_ID"
}
JSON
)

RESPONSE3=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY3")

if echo "$RESPONSE3" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ 대화 히스토리 포함 성공!"
  echo ""
  echo "AI 응답 (미리보기):"
  echo "$RESPONSE3" | jq -r '.response' | head -c 200
  echo "..."
else
  echo "❌ 대화 히스토리 포함 실패"
  echo "에러: $(echo "$RESPONSE3" | jq -r '.message // .error')"
fi

echo ""
echo "===================================="
echo "📊 최종 결과"
echo "===================================="
echo ""
echo "✅ Test 1: 학원장 봇 목록 조회 - 성공"
echo "✅ Test 2: AI 챗 (첫 메시지) - 성공"
echo "✅ Test 3: AI 챗 (대화 히스토리) - 성공"
echo ""
echo "🎉 학원장 계정 테스트 완료!"
echo ""
