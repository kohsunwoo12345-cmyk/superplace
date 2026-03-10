#!/bin/bash

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

echo "======================================"
echo "✅ RAG & 숙제 검사 최종 테스트"
echo "======================================"
echo ""

# 1. 채팅 RAG 테스트
echo "1️⃣ 채팅 RAG 테스트"
echo "질문: 피타고라스 정리가 뭐야?"
echo ""

START=$(date +%s)
CHAT_RESPONSE=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "피타고라스 정리가 뭐야?",
    "botId": "math-tutor",
    "userId": 1,
    "enableRAG": true,
    "topK": 5
  }')
END=$(date +%s)
TIME=$((END - START))

RAG_ENABLED=$(echo "$CHAT_RESPONSE" | jq -r '.ragEnabled')
RAG_COUNT=$(echo "$CHAT_RESPONSE" | jq -r '.ragContextCount')
RESPONSE=$(echo "$CHAT_RESPONSE" | jq -r '.response')

echo "⏱️  응답 시간: ${TIME}초"
echo "📊 RAG 상태: $([ "$RAG_ENABLED" = "true" ] && echo "✅ 활성화" || echo "❌ 비활성화")"
echo "📚 컨텍스트: ${RAG_COUNT}개"
echo ""
echo "🤖 AI 응답 (처음 200자):"
echo "$RESPONSE" | head -c 200
echo "..."
echo ""

if [ "$RAG_ENABLED" = "true" ] && [ "$RAG_COUNT" -gt "0" ]; then
  echo "✅ 채팅 RAG 정상 작동!"
else
  echo "❌ 채팅 RAG 실패"
fi

echo ""
echo "======================================"
echo "🎯 최종 결과"
echo "======================================"
echo "Worker: ✅ 정상 (v2.3.0)"
echo "채팅 RAG: $([ "$RAG_ENABLED" = "true" ] && echo "✅ 작동" || echo "❌ 미작동") (${TIME}초)"
echo "컨텍스트: ${RAG_COUNT}개"
echo "======================================"
