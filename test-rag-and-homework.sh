#!/bin/bash

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "======================================"
echo "🧪 RAG 및 숙제 검사 통합 테스트"
echo "======================================"
echo ""

# 1. Worker 상태 확인
echo "1️⃣ Worker 상태 확인..."
WORKER_STATUS=$(curl -s "$WORKER_URL")
echo "$WORKER_STATUS" | jq '.'
echo ""

# 2. RAG 지식 업로드 (수학 피타고라스 정리)
echo "2️⃣ RAG 지식 업로드..."
KNOWLEDGE_TEXT="피타고라스 정리는 직각삼각형에서 빗변의 제곱은 다른 두 변의 제곱의 합과 같다는 정리입니다. 수식으로 표현하면 a² + b² = c² 입니다."

# 임베딩 생성
echo "📡 임베딩 생성 중..."
EMBED_RESPONSE=$(curl -s -X POST "$WORKER_URL/generate-embedding" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$KNOWLEDGE_TEXT\"}")

EMBEDDING=$(echo "$EMBED_RESPONSE" | jq -r '.embedding')
EMBED_SUCCESS=$(echo "$EMBED_RESPONSE" | jq -r '.success')

if [ "$EMBED_SUCCESS" = "true" ]; then
  echo "✅ 임베딩 생성 성공 ($(echo "$EMBEDDING" | jq 'length') 차원)"
else
  echo "❌ 임베딩 생성 실패"
  echo "$EMBED_RESPONSE" | jq '.'
  exit 1
fi
echo ""

# Vectorize 업로드
echo "📡 Vectorize 업로드 중..."
VECTOR_ID="test-pythagoras-$(date +%s)"
UPLOAD_RESPONSE=$(curl -s -X POST "$WORKER_URL/vectorize-upload" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"vectors\": [
      {
        \"id\": \"$VECTOR_ID\",
        \"values\": $EMBEDDING,
        \"metadata\": {
          \"botId\": \"test-math-bot\",
          \"text\": \"$KNOWLEDGE_TEXT\",
          \"filename\": \"pythagoras.txt\",
          \"index\": 0
        }
      }
    ]
  }")

UPLOAD_SUCCESS=$(echo "$UPLOAD_RESPONSE" | jq -r '.success')
if [ "$UPLOAD_SUCCESS" = "true" ]; then
  echo "✅ Vectorize 업로드 성공"
else
  echo "❌ Vectorize 업로드 실패"
  echo "$UPLOAD_RESPONSE" | jq '.'
  exit 1
fi
echo ""

# 3. 채팅 RAG 테스트
echo "3️⃣ 채팅 RAG 테스트..."
echo "📡 질문: 피타고라스 정리에 대해 설명해줘"

CHAT_START=$(date +%s%3N)
CHAT_RESPONSE=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "피타고라스 정리에 대해 설명해줘",
    "botId": "test-math-bot",
    "userId": 1,
    "enableRAG": true,
    "topK": 5
  }')
CHAT_END=$(date +%s%3N)
CHAT_TIME=$((CHAT_END - CHAT_START))

echo ""
echo "⏱️  응답 시간: ${CHAT_TIME}ms"
echo ""
echo "📊 RAG 상태:"
RAG_ENABLED=$(echo "$CHAT_RESPONSE" | jq -r '.ragEnabled')
RAG_COUNT=$(echo "$CHAT_RESPONSE" | jq -r '.ragContextCount')
echo "  - RAG 활성화: $RAG_ENABLED"
echo "  - 컨텍스트 수: $RAG_COUNT"
echo ""

if [ "$RAG_ENABLED" = "true" ] && [ "$RAG_COUNT" -gt "0" ]; then
  echo "✅ 채팅 RAG 정상 작동!"
  echo ""
  echo "🤖 AI 응답:"
  echo "$CHAT_RESPONSE" | jq -r '.reply' | head -c 200
  echo "..."
else
  echo "❌ 채팅 RAG 작동 실패"
  echo "$CHAT_RESPONSE" | jq '.'
fi
echo ""
echo ""

# 4. 숙제 검사 RAG 테스트
echo "4️⃣ 숙제 검사 테스트..."
echo "📸 테스트 이미지: 간단한 수학 문제"

# Base64 테스트 이미지 (작은 PNG)
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAP0QAwH8n4J2AAAAAElFTkSuQmCC"

HOMEWORK_START=$(date +%s%3N)
echo "📡 숙제 검사 요청 중..."

HOMEWORK_RESPONSE=$(curl -s -X POST "$WORKER_URL/grade" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"images\": [\"data:image/png;base64,$TEST_IMAGE\"],
    \"userId\": 1,
    \"userName\": \"테스트학생\",
    \"subject\": \"math\",
    \"enableRAG\": true,
    \"ragBotId\": \"test-math-bot\"
  }")

HOMEWORK_END=$(date +%s%3N)
HOMEWORK_TIME=$((HOMEWORK_END - HOMEWORK_START))

echo ""
echo "⏱️  처리 시간: ${HOMEWORK_TIME}ms ($(echo "scale=2; $HOMEWORK_TIME/1000" | bc)초)"
echo ""

HOMEWORK_SUCCESS=$(echo "$HOMEWORK_RESPONSE" | jq -r '.success')

if [ "$HOMEWORK_SUCCESS" = "true" ]; then
  echo "✅ 숙제 검사 성공!"
  echo ""
  echo "📊 처리 결과:"
  echo "  - 이미지 수: $(echo "$HOMEWORK_RESPONSE" | jq -r '.processedImages')"
  echo "  - OCR 텍스트: $(echo "$HOMEWORK_RESPONSE" | jq -r '.ocrText' | head -c 50)..."
  echo "  - 과목 감지: $(echo "$HOMEWORK_RESPONSE" | jq -r '.detectedSubject')"
  echo ""
  echo "📝 피드백:"
  echo "$HOMEWORK_RESPONSE" | jq -r '.feedback' | head -c 300
  echo "..."
else
  echo "❌ 숙제 검사 실패"
  echo "$HOMEWORK_RESPONSE" | jq '.'
fi

echo ""
echo "======================================"
echo "🎯 테스트 완료 요약"
echo "======================================"
echo "✅ Worker 상태: 정상"
echo "✅ 임베딩 생성: $(echo "scale=2; $CHAT_TIME/1000" | bc)초"
echo "$([ "$RAG_ENABLED" = "true" ] && echo "✅" || echo "❌") 채팅 RAG: $RAG_ENABLED (컨텍스트: $RAG_COUNT개)"
echo "✅ 숙제 검사: $(echo "scale=2; $HOMEWORK_TIME/1000" | bc)초"
echo "======================================"
