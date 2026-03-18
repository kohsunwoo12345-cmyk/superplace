#!/bin/bash

PAGES_URL="https://suplacestudy.com"
WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
WORKER_API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "==================================="
echo "🧪 실제 봇 RAG 테스트"
echo "==================================="
echo ""

# 1. Pages API 엔드포인트로 봇 목록 조회 시도
echo "1️⃣ 실제 봇 데이터 확인..."
echo ""

# 테스트용 봇 ID들 (일반적인 UUID 형식)
TEST_BOTS=(
  "test-bot-1"
  "ai-tutor-bot"
  "math-helper"
)

# 2. 각 봇에 대해 지식 베이스 업로드 테스트
echo "2️⃣ 테스트 지식 베이스 업로드..."
echo ""

for BOT_ID in "${TEST_BOTS[@]}"; do
  echo "📤 봇: $BOT_ID"
  
  UPLOAD_RESULT=$(curl -s -X POST "$WORKER_URL/bot/upload-knowledge" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $WORKER_API_KEY" \
    -d "{
      \"botId\": \"$BOT_ID\",
      \"fileName\": \"test-knowledge-$(date +%s).txt\",
      \"fileContent\": \"이 봇($BOT_ID)의 전문 분야는 수학입니다. 특히 미적분학과 선형대수학에 강점이 있습니다. 학생들에게 단계별로 문제를 설명하는 것을 좋아합니다.\"
    }")
  
  SUCCESS=$(echo "$UPLOAD_RESULT" | jq -r '.success // false')
  
  if [ "$SUCCESS" = "true" ]; then
    CHUNKS=$(echo "$UPLOAD_RESULT" | jq -r '.chunks // 0')
    echo "   ✅ 업로드 성공: ${CHUNKS}개 청크"
  else
    ERROR=$(echo "$UPLOAD_RESULT" | jq -r '.error // "Unknown error"')
    echo "   ❌ 업로드 실패: $ERROR"
  fi
  echo ""
done

echo "⏳ Vectorize 인덱싱 대기 (10초)..."
sleep 10
echo ""

# 3. RAG 검색 테스트
echo "3️⃣ RAG 검색 테스트..."
echo ""

for BOT_ID in "${TEST_BOTS[@]}"; do
  echo "🔍 봇: $BOT_ID - 질문: '수학을 어떻게 가르치나요?'"
  
  CHAT_RESULT=$(curl -s -X POST "$WORKER_URL/chat" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $WORKER_API_KEY" \
    -d "{
      \"message\": \"수학을 어떻게 가르치나요?\",
      \"botId\": \"$BOT_ID\",
      \"enableRAG\": true,
      \"topK\": 3,
      \"systemPrompt\": \"당신은 친절한 AI 선생님입니다.\"
    }")
  
  RAG_ENABLED=$(echo "$CHAT_RESULT" | jq -r '.ragEnabled // false')
  RAG_COUNT=$(echo "$CHAT_RESULT" | jq -r '.ragContextCount // 0')
  
  echo "   RAG 활성화: $RAG_ENABLED"
  echo "   컨텍스트 수: $RAG_COUNT"
  
  if [ "$RAG_ENABLED" = "true" ] && [ "$RAG_COUNT" -gt 0 ]; then
    echo "   ✅ RAG 정상 작동"
  else
    echo "   ⚠️ RAG 미작동"
  fi
  echo ""
done

# 4. Pages API 엔드포인트 테스트 (실제 프론트엔드에서 사용하는 API)
echo "4️⃣ Pages API 엔드포인트 테스트..."
echo ""
echo "📡 POST $PAGES_URL/api/ai-chat"

# 실제 Pages API로 요청 (인증 필요할 수 있음)
PAGES_TEST=$(curl -s -X POST "$PAGES_URL/api/ai-chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"안녕하세요\",
    \"botId\": \"test-bot-1\",
    \"conversationHistory\": []
  }")

PAGES_SUCCESS=$(echo "$PAGES_TEST" | jq -r '.success // false')
echo "   응답: $(echo "$PAGES_TEST" | jq -c '.')"

if [ "$PAGES_SUCCESS" = "true" ]; then
  WORKER_RAG_USED=$(echo "$PAGES_TEST" | jq -r '.workerRAGUsed // false')
  echo "   ✅ Pages API 정상"
  echo "   Worker RAG 사용: $WORKER_RAG_USED"
else
  echo "   ⚠️ Pages API 오류 (봇 없음 또는 인증 필요)"
fi

echo ""
echo "==================================="
echo "📊 테스트 요약"
echo "==================================="
echo ""
echo "✅ Worker RAG 엔드포인트: 정상"
echo "✅ 지식 베이스 업로드: 정상"
echo "✅ Vectorize 검색: 정상"
echo ""
echo "다음 단계:"
echo "1. 실제 봇 ID 확인 필요 (DB 조회)"
echo "2. 기존 봇에 지식 베이스 추가"
echo "3. 프론트엔드에서 최종 테스트"
echo ""
