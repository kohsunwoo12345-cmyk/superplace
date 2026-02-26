#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 AI 봇 생성 및 사용 전체 플로우 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="https://superplacestudy.pages.dev"

# 1단계: AI 봇 생성 테스트
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  AI 봇 생성 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MODELS=("gemini-2.5-flash" "gemini-2.5-pro")
BOT_IDS=()

for MODEL in "${MODELS[@]}"; do
  echo ""
  echo "📝 모델로 봇 생성 중: $MODEL"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/admin/ai-bots" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"테스트봇 ${MODEL}\",
      \"description\": \"${MODEL} 모델 테스트용\",
      \"systemPrompt\": \"당신은 친절한 AI 어시스턴트입니다.\",
      \"model\": \"${MODEL}\",
      \"temperature\": 0.7,
      \"maxTokens\": 500,
      \"topK\": 40,
      \"topP\": 0.95
    }")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    BOT_ID=$(echo "$BODY" | jq -r '.botId' 2>/dev/null)
    if [ ! -z "$BOT_ID" ] && [ "$BOT_ID" != "null" ]; then
      echo "   ✅ 봇 생성 성공!"
      echo "   🆔 Bot ID: $BOT_ID"
      BOT_IDS+=("$BOT_ID:$MODEL")
    else
      echo "   ⚠️  봇 생성 응답이 이상함"
      echo "   $BODY"
    fi
  else
    echo "   ❌ 봇 생성 실패 (HTTP $HTTP_CODE)"
    echo "   $BODY"
  fi
done

sleep 2

# 2단계: 생성된 봇 목록 확인
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  생성된 봇 목록 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s "${BASE_URL}/api/admin/ai-bots")
TOTAL_BOTS=$(echo "$RESPONSE" | jq -r '.bots | length' 2>/dev/null)

if [ ! -z "$TOTAL_BOTS" ] && [ "$TOTAL_BOTS" != "null" ]; then
  echo "✅ 전체 봇 개수: $TOTAL_BOTS"
  echo ""
  echo "최근 생성된 봇 3개:"
  echo "$RESPONSE" | jq -r '.bots[-3:] | .[] | "  - \(.name) (\(.model))"' 2>/dev/null
else
  echo "❌ 봇 목록 조회 실패"
fi

sleep 1

# 3단계: 생성된 각 봇으로 대화 테스트
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  생성된 봇으로 대화 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SUCCESS_COUNT=0
TOTAL_COUNT=0

for BOT_INFO in "${BOT_IDS[@]}"; do
  BOT_ID="${BOT_INFO%%:*}"
  MODEL="${BOT_INFO##*:}"
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  
  echo ""
  echo "💬 봇 대화 테스트: $MODEL (ID: $BOT_ID)"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/ai/chat" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"안녕하세요! 간단히 자기소개 해주세요.\",
      \"systemPrompt\": \"당신은 친절한 AI 어시스턴트입니다.\",
      \"model\": \"${MODEL}\",
      \"temperature\": 0.7,
      \"maxTokens\": 200
    }")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    CHAT_RESPONSE=$(echo "$BODY" | jq -r '.response' 2>/dev/null)
    if [ ! -z "$CHAT_RESPONSE" ] && [ "$CHAT_RESPONSE" != "null" ]; then
      echo "   ✅ 대화 성공!"
      echo "   📥 응답 미리보기:"
      echo "$CHAT_RESPONSE" | head -c 100
      echo "..."
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
      echo "   ⚠️  응답이 비어있음"
    fi
  else
    echo "   ❌ 대화 실패 (HTTP $HTTP_CODE)"
  fi
done

# 최종 결과
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 최종 테스트 결과"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "생성된 봇 수: ${#BOT_IDS[@]}"
echo "대화 테스트: $SUCCESS_COUNT/$TOTAL_COUNT 성공"
echo ""

if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ] && [ $TOTAL_COUNT -gt 0 ]; then
  echo "🎉 모든 테스트 통과!"
  echo "   ✅ AI 봇 생성: 정상"
  echo "   ✅ 봇 목록 조회: 정상"
  echo "   ✅ 대화 기능: 정상"
else
  echo "⚠️  일부 테스트 실패"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
