#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 End-to-End Chatbot Test (AI 생성 → 챗봇 사용)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_BASE="https://superplacestudy.pages.dev"

# Working models only
MODELS=(
  "gemini-2.5-flash"
  "gemini-2.5-pro"
)

MODEL_NAMES=(
  "Gemini 2.5 Flash"
  "Gemini 2.5 Pro"
)

for i in "${!MODELS[@]}"; do
  MODEL="${MODELS[$i]}"
  NAME="${MODEL_NAMES[$i]}"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🤖 모델: $NAME ($MODEL)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Step 1: Create AI Bot
  echo "📝 Step 1: AI 봇 생성 중..."
  BOT_RESPONSE=$(curl -s -X POST "$API_BASE/api/admin/ai-bots" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Test Bot - $NAME\",
      \"description\": \"자동 테스트용 봇\",
      \"model\": \"$MODEL\",
      \"systemPrompt\": \"당신은 친절한 AI 어시스턴트입니다. 간단하고 명확하게 답변해주세요.\",
      \"temperature\": 0.7,
      \"maxTokens\": 1000,
      \"topK\": 40,
      \"topP\": 0.95,
      \"welcomeMessage\": \"안녕하세요! 무엇을 도와드릴까요?\",
      \"language\": \"ko\"
    }")
  
  BOT_ID=$(echo "$BOT_RESPONSE" | jq -r '.id' 2>/dev/null)
  
  if [ "$BOT_ID" != "null" ] && [ -n "$BOT_ID" ]; then
    echo "✅ 봇 생성 성공! (ID: $BOT_ID)"
    
    # Step 2: Test chatbot conversation
    echo ""
    echo "💬 Step 2: 챗봇 대화 테스트..."
    
    CHAT_RESPONSE=$(curl -s -X POST "$API_BASE/api/ai/chat" \
      -H "Content-Type: application/json" \
      -d "{
        \"message\": \"안녕하세요! 당신은 누구인가요?\",
        \"systemPrompt\": \"당신은 친절한 AI 어시스턴트입니다. 간단하고 명확하게 답변해주세요.\",
        \"model\": \"$MODEL\",
        \"temperature\": 0.7,
        \"maxTokens\": 500
      }")
    
    CHAT_TEXT=$(echo "$CHAT_RESPONSE" | jq -r '.text' 2>/dev/null)
    
    if [ "$CHAT_TEXT" != "null" ] && [ -n "$CHAT_TEXT" ]; then
      echo "✅ 챗봇 응답 성공!"
      echo "   응답: ${CHAT_TEXT:0:100}..."
      echo ""
      echo "✅ 전체 테스트 성공! $NAME 모델 정상 작동"
    else
      echo "❌ 챗봇 응답 실패"
      echo "   Error: $(echo "$CHAT_RESPONSE" | jq -r '.error' 2>/dev/null)"
    fi
  else
    echo "❌ 봇 생성 실패"
    echo "   Error: $(echo "$BOT_RESPONSE" | jq -r '.error' 2>/dev/null)"
  fi
  
  echo ""
  echo ""
  sleep 2
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ End-to-End 테스트 완료"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
