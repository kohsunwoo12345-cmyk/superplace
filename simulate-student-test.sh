#!/bin/bash

echo "🧪 학생 계정 시뮬레이션 테스트"
echo "===================================="

# 기존에 확인된 봇 ID와 학원 ID 사용
STUDENT_ID="test-student-$(date +%s)"
ACADEMY_ID="academy-test-001"
BOT_ID="bot-1773803533575-qrn2pluec"

echo ""
echo "📋 테스트 시나리오:"
echo "-----------------------------------"
echo "학생 ID: $STUDENT_ID"
echo "학원 ID: $ACADEMY_ID"
echo "봇 ID: $BOT_ID"
echo ""

# Test 1: 봇 목록 조회 (학생)
echo "🤖 Test 1: 학생 - 할당된 봇 목록 조회"
echo "-----------------------------------"
echo "API: /api/user/ai-bots?academyId=$ACADEMY_ID&userId=$STUDENT_ID"

RESPONSE1=$(curl -s "https://suplacestudy.com/api/user/ai-bots?academyId=$ACADEMY_ID&userId=$STUDENT_ID")

echo "Response:"
echo "$RESPONSE1" | jq '.' 2>/dev/null || echo "$RESPONSE1"

if echo "$RESPONSE1" | jq -e '.success == true' > /dev/null 2>&1; then
  BOT_COUNT=$(echo "$RESPONSE1" | jq -r '.count')
  echo ""
  echo "✅ API 호출 성공: $BOT_COUNT 개의 봇"
  
  if [ "$BOT_COUNT" -gt 0 ]; then
    FIRST_BOT=$(echo "$RESPONSE1" | jq -r '.bots[0].id')
    echo "첫 번째 봇 ID: $FIRST_BOT"
    BOT_ID=$FIRST_BOT
  else
    echo "⚠️ 할당된 봇이 없음 - 기본 봇 ID 사용"
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
  "userId": "$STUDENT_ID",
  "conversationHistory": [],
  "userRole": "STUDENT",
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
echo "===================================="
echo "📊 테스트 완료"
echo "===================================="
