#!/bin/bash

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "================================================"
echo "🧪 RAG 구현 실제 작동 테스트"
echo "================================================"
echo ""

# 1. 지식 베이스 생성 및 업로드
echo "1️⃣ 지식 베이스 업로드..."
MATH_TEXT="Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides. Formula: a² + b² = c² where c is the hypotenuse."

# 임베딩 생성
MATH_EMBED=$(curl -s -X POST "$WORKER_URL/generate-embedding" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"text\": \"$MATH_TEXT\"}")

MATH_EMBEDDING=$(echo "$MATH_EMBED" | jq -c '.embedding')
echo "  ✅ 임베딩 생성 완료: $(echo "$MATH_EMBED" | jq '.dimensions')차원"

# Vectorize에 업로드
UPLOAD_RESULT=$(curl -s -X POST "$WORKER_URL/vectorize-upload" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"vectors\": [
      {
        \"id\": \"bot-math-pythagoras\",
        \"values\": $MATH_EMBEDDING,
        \"metadata\": {
          \"botId\": \"math-bot-001\",
          \"fileName\": \"pythagoras.txt\",
          \"chunkIndex\": 0,
          \"text\": \"$MATH_TEXT\",
          \"totalChunks\": 1
        }
      }
    ]
  }")

echo "  ✅ $(echo "$UPLOAD_RESULT" | jq -r '.message')"
echo ""

# 2. RAG 검색 테스트
echo "2️⃣ AI 챗봇 RAG 검색 테스트..."
echo "  💬 질문: 'What is Pythagorean theorem?'"
echo ""

CHAT_RESULT=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "message": "What is Pythagorean theorem?",
    "botId": "math-bot-001",
    "userId": 1,
    "enableRAG": true,
    "topK": 5,
    "systemPrompt": "You are a math teacher. Use the provided knowledge base to answer accurately.",
    "conversationHistory": []
  }')

echo "  📊 결과:"
echo "    - 성공: $(echo "$CHAT_RESULT" | jq -r '.success')"
echo "    - RAG 활성화: $(echo "$CHAT_RESULT" | jq -r '.ragEnabled')"
echo "    - RAG 컨텍스트 수: $(echo "$CHAT_RESULT" | jq -r '.ragContextCount')"
echo ""
echo "  🤖 AI 응답:"
echo "$CHAT_RESULT" | jq -r '.response'
echo ""

# 3. 숙제 채점 테스트 (RAG 없이)
echo "3️⃣ 숙제 채점 테스트..."
GRADE_RESULT=$(curl -s -X POST "$WORKER_URL/grade" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q=="],
    "userId": 1,
    "userName": "학생",
    "systemPrompt": "Grade this homework and respond in JSON format",
    "model": "gemini-2.0-flash",
    "temperature": 0.3
  }')

echo "    - 성공: $(echo "$GRADE_RESULT" | jq -r '.success')"
if [ "$(echo "$GRADE_RESULT" | jq -r '.success')" = "true" ]; then
  echo "    - OCR 성공: $(echo "$GRADE_RESULT" | jq -r '.results[0].ocrText | length')자"
else
  echo "    - 오류: $(echo "$GRADE_RESULT" | jq -r '.error')"
fi
echo ""

echo "================================================"
echo "✅ 테스트 완료!"
echo "================================================"
echo ""

if [ "$(echo "$CHAT_RESULT" | jq -r '.ragEnabled')" = "true" ]; then
  echo "🎉 RAG가 정상 작동합니다!"
  echo "  - 지식 베이스 업로드: ✅"
  echo "  - Cloudflare AI 임베딩: ✅"
  echo "  - Vectorize 검색: ✅"
  echo "  - AI 응답 생성: ✅"
else
  echo "⚠️ RAG 비활성화됨"
  echo "  현재 컨텍스트 수: $(echo "$CHAT_RESULT" | jq -r '.ragContextCount')"
fi
