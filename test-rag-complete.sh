#!/bin/bash

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"
BOT_ID="rag-test-bot-$(date +%s)"

echo "==================================="
echo "🎯 RAG 전체 흐름 테스트"
echo "==================================="
echo ""
echo "🤖 테스트 봇 ID: $BOT_ID"
echo ""

# Step 1: 지식 베이스 업로드
echo "📤 Step 1: 지식 베이스 업로드"
echo "-----------------------------------"
UPLOAD_RESULT=$(curl -s -X POST "$WORKER_URL/bot/upload-knowledge" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"botId\": \"$BOT_ID\",
    \"fileName\": \"company-info.txt\",
    \"fileContent\": \"수플레이스(Suplace)는 대한민국의 혁신적인 AI 기반 학습 플랫폼입니다. 우리의 주요 서비스는 다음과 같습니다: 1) AI 맞춤형 학습 코칭, 2) 실시간 숙제 채점 시스템, 3) 개인화된 학습 분석. 설립일: 2023년. 본사: 서울특별시. CEO: 홍길동. 주요 기술: 머신러닝, 자연어처리, 컴퓨터 비전. 우리는 학생들이 더 효과적으로 학습할 수 있도록 돕습니다.\"
  }")

echo "$UPLOAD_RESULT" | jq '.'
UPLOAD_SUCCESS=$(echo "$UPLOAD_RESULT" | jq -r '.success')

if [ "$UPLOAD_SUCCESS" != "true" ]; then
  echo "❌ 업로드 실패!"
  exit 1
fi

echo ""
echo "✅ 지식 베이스 업로드 완료"
echo ""
echo ""

# Step 2: 약간 대기 (Vectorize 인덱싱)
echo "⏳ Step 2: Vectorize 인덱싱 대기 (3초)..."
sleep 3
echo ""

# Step 3: RAG 없이 질문 (비교용)
echo "❌ Step 3: RAG 없이 질문 (비교용)"
echo "-----------------------------------"
echo "질문: 수플레이스의 CEO는 누구인가요?"
echo ""
NO_RAG_RESULT=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"message\": \"수플레이스의 CEO는 누구인가요?\",
    \"botId\": \"different-bot-id\",
    \"enableRAG\": false,
    \"systemPrompt\": \"당신은 친절한 AI입니다.\"
  }")

echo "📝 응답:"
echo "$NO_RAG_RESULT" | jq -r '.response' | head -c 200
echo "..."
echo ""
echo "RAG 사용: $(echo "$NO_RAG_RESULT" | jq -r '.ragEnabled')"
echo "컨텍스트 수: $(echo "$NO_RAG_RESULT" | jq -r '.ragContextCount')"
echo ""
echo ""

# Step 4: RAG로 질문 (메인 테스트)
echo "✅ Step 4: RAG로 질문 (메인 테스트)"
echo "-----------------------------------"
echo "질문: 수플레이스의 CEO는 누구인가요?"
echo ""
RAG_RESULT=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"message\": \"수플레이스의 CEO는 누구인가요?\",
    \"botId\": \"$BOT_ID\",
    \"enableRAG\": true,
    \"topK\": 3,
    \"systemPrompt\": \"당신은 지식 베이스의 정보를 정확히 답변하는 AI입니다.\"
  }")

echo "📝 응답:"
echo "$RAG_RESULT" | jq -r '.response'
echo ""
echo "RAG 사용: $(echo "$RAG_RESULT" | jq -r '.ragEnabled')"
echo "컨텍스트 수: $(echo "$RAG_RESULT" | jq -r '.ragContextCount')"
echo ""
echo ""

# Step 5: 결과 분석
echo "==================================="
echo "📊 테스트 결과 분석"
echo "==================================="
echo ""

RAG_ENABLED=$(echo "$RAG_RESULT" | jq -r '.ragEnabled')
RAG_COUNT=$(echo "$RAG_RESULT" | jq -r '.ragContextCount')

if [ "$RAG_ENABLED" == "true" ] && [ "$RAG_COUNT" -gt 0 ]; then
  echo "✅ RAG 정상 작동!"
  echo "   - RAG 활성화: ✅"
  echo "   - 컨텍스트 검색: ✅ (${RAG_COUNT}개)"
  echo "   - 지식 베이스 활용: ✅"
  echo ""
  echo "🎉 모든 테스트 통과!"
else
  echo "⚠️ RAG 미작동 또는 부분 작동"
  echo "   - RAG 활성화: $RAG_ENABLED"
  echo "   - 컨텍스트 검색: $RAG_COUNT 개"
  echo ""
  echo "❓ 가능한 원인:"
  echo "   1. Vectorize 인덱싱 지연 (더 기다려보세요)"
  echo "   2. botId 필터링 문제"
  echo "   3. 임베딩 유사도가 낮음"
fi

echo ""
echo "==================================="
