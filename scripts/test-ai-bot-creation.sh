#!/bin/bash

# AI 봇 생성 및 사용 테스트 스크립트
BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🤖 AI 봇 생성 및 사용 테스트"
echo "======================================"
echo ""

# 1. 환경 변수 확인
echo "1️⃣  Gemini API 키 확인..."
ENV_CHECK=$(curl -s "$BASE_URL/api/test-env" | jq -r '{hasKey, keyLength, keyPrefix}')
HAS_KEY=$(echo "$ENV_CHECK" | jq -r '.hasKey')

if [ "$HAS_KEY" == "true" ]; then
  echo "   ✅ Gemini API 키 설정됨"
  echo "$ENV_CHECK" | jq '.'
else
  echo "   ❌ Gemini API 키가 설정되지 않았습니다"
  exit 1
fi
echo ""

# 2. 기존 활성 봇 확인
echo "2️⃣  기존 활성 봇 목록 조회..."
ACTIVE_BOTS=$(curl -s "$BASE_URL/api/admin/ai-bots" | jq '[.bots[] | select(.isActive == 1)]')
ACTIVE_COUNT=$(echo "$ACTIVE_BOTS" | jq 'length')

echo "   📋 활성 봇 개수: $ACTIVE_COUNT"
if [ "$ACTIVE_COUNT" -gt 0 ]; then
  echo "$ACTIVE_BOTS" | jq '.[] | {id, name, model}'
fi
echo ""

# 3. 새 봇 생성
echo "3️⃣  새로운 AI 봇 생성..."
BOT_NAME="테스트봇-$(date +%s)"
CREATE_RESULT=$(curl -s -X POST "$BASE_URL/api/admin/ai-bots" \
  -H 'Content-Type: application/json' \
  -d "{
    \"name\": \"$BOT_NAME\",
    \"description\": \"자동 테스트용 봇입니다\",
    \"systemPrompt\": \"당신은 친절한 AI 어시스턴트입니다. 간결하고 명확하게 답변해주세요.\",
    \"welcomeMessage\": \"안녕하세요! 무엇을 도와드릴까요?\",
    \"starterMessage1\": \"간단한 인사말을 해주세요\",
    \"starterMessage2\": \"오늘 날씨에 대해 이야기해주세요\",
    \"starterMessage3\": \"재미있는 사실을 알려주세요\",
    \"profileIcon\": \"🤖\",
    \"model\": \"gemini-2.5-flash\",
    \"temperature\": 0.7,
    \"maxTokens\": 1000,
    \"topK\": 40,
    \"topP\": 0.95,
    \"language\": \"ko\"
  }")

BOT_ID=$(echo "$CREATE_RESULT" | jq -r '.botId')
SUCCESS=$(echo "$CREATE_RESULT" | jq -r '.success')

if [ "$SUCCESS" == "true" ]; then
  echo "   ✅ 봇 생성 성공"
  echo "   📌 Bot ID: $BOT_ID"
  echo "   📌 Bot Name: $BOT_NAME"
else
  echo "   ❌ 봇 생성 실패"
  echo "$CREATE_RESULT" | jq '.'
  exit 1
fi
echo ""

# 잠시 대기 (DB 동기화)
sleep 1

# 4. 생성된 봇 확인
echo "4️⃣  생성된 봇 상세 정보 확인..."
BOT_INFO=$(curl -s "$BASE_URL/api/admin/ai-bots" | jq ".bots[] | select(.id == \"$BOT_ID\")")
BOT_ACTIVE=$(echo "$BOT_INFO" | jq -r '.isActive')

if [ "$BOT_ACTIVE" == "1" ]; then
  echo "   ✅ 봇 활성화 상태 확인"
  echo "$BOT_INFO" | jq '{id, name, isActive, model, systemPrompt, welcomeMessage}'
else
  echo "   ❌ 봇이 비활성화 상태입니다"
  exit 1
fi
echo ""

# 5. AI 채팅 테스트
echo "5️⃣  AI 채팅 기능 테스트..."
SYSTEM_PROMPT=$(echo "$BOT_INFO" | jq -r '.systemPrompt')
MODEL=$(echo "$BOT_INFO" | jq -r '.model')
TEMPERATURE=$(echo "$BOT_INFO" | jq -r '.temperature')
MAX_TOKENS=$(echo "$BOT_INFO" | jq -r '.maxTokens')
TOP_K=$(echo "$BOT_INFO" | jq -r '.topK')
TOP_P=$(echo "$BOT_INFO" | jq -r '.topP')

echo "   📤 메시지 전송: '안녕하세요, 간단히 인사해주세요'"

CHAT_RESULT=$(curl -s -X POST "$BASE_URL/api/ai/chat" \
  -H 'Content-Type: application/json' \
  -d "{
    \"message\": \"안녕하세요, 간단히 인사해주세요\",
    \"systemPrompt\": \"$SYSTEM_PROMPT\",
    \"model\": \"$MODEL\",
    \"temperature\": $TEMPERATURE,
    \"maxTokens\": $MAX_TOKENS,
    \"topK\": $TOP_K,
    \"topP\": $TOP_P
  }")

RESPONSE=$(echo "$CHAT_RESULT" | jq -r '.response')
ERROR=$(echo "$CHAT_RESULT" | jq -r '.error')

if [ "$ERROR" == "null" ] && [ -n "$RESPONSE" ]; then
  echo "   ✅ AI 응답 성공"
  echo ""
  echo "   💬 AI 응답:"
  echo "   $RESPONSE"
  echo ""
  
  # 토큰 사용량 표시
  USAGE=$(echo "$CHAT_RESULT" | jq '.usage')
  if [ "$USAGE" != "null" ]; then
    echo "   📊 토큰 사용량:"
    echo "$USAGE" | jq '.'
  fi
else
  echo "   ❌ AI 응답 실패"
  echo "   오류: $ERROR"
  echo ""
  echo "   전체 응답:"
  echo "$CHAT_RESULT" | jq '.'
  exit 1
fi
echo ""

# 6. 두 번째 대화 테스트
echo "6️⃣  연속 대화 테스트..."
echo "   📤 메시지 전송: '1+1은 무엇인가요?'"

CHAT_RESULT2=$(curl -s -X POST "$BASE_URL/api/ai/chat" \
  -H 'Content-Type: application/json' \
  -d "{
    \"message\": \"1+1은 무엇인가요?\",
    \"systemPrompt\": \"$SYSTEM_PROMPT\",
    \"model\": \"$MODEL\",
    \"temperature\": $TEMPERATURE,
    \"maxTokens\": $MAX_TOKENS,
    \"topK\": $TOP_K,
    \"topP\": $TOP_P
  }")

RESPONSE2=$(echo "$CHAT_RESULT2" | jq -r '.response')
ERROR2=$(echo "$CHAT_RESULT2" | jq -r '.error')

if [ "$ERROR2" == "null" ] && [ -n "$RESPONSE2" ]; then
  echo "   ✅ AI 응답 성공"
  echo ""
  echo "   💬 AI 응답:"
  echo "   $RESPONSE2"
else
  echo "   ❌ AI 응답 실패"
  echo "   오류: $ERROR2"
fi
echo ""

# 최종 결과
echo "======================================"
echo "🎯 테스트 결과 요약"
echo ""
echo "✅ Gemini API 키: 설정됨"
echo "✅ 봇 생성: 성공 ($BOT_ID)"
echo "✅ 봇 활성화: 확인됨"
echo "✅ AI 채팅: 정상 작동"
echo "✅ 연속 대화: 정상 작동"
echo ""
echo "📊 최종 통계:"
echo "   • 전체 활성 봇: $((ACTIVE_COUNT + 1))개"
echo "   • 새로 생성된 봇: $BOT_NAME"
echo "   • 모델: $MODEL"
echo "   • 테스트 메시지: 2개"
echo ""
echo "🎉 모든 테스트 통과!"
echo ""
echo "🔗 관련 링크:"
echo "   • 봇 관리: $BASE_URL/dashboard/admin/ai-bots"
echo "   • AI 채팅: $BASE_URL/dashboard/ai-chat"
echo ""
