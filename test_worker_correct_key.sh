#!/bin/bash

echo "🧪 Python Worker 직접 테스트 (올바른 API 키)"
echo "=========================================="

WORKER_URL="https://physonsuperplacestudy-production.kohsunwoo12345.workers.dev/grade"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

# 간단한 테스트 이미지
BASE64_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAA3ElEQVR42u3RAQ0AAAjDMO5fNCCDkC5z0HTVriRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkvQ1GwAA//8DAEYQEwFjLQvsAAAAAElFTkSuQmCC"

echo "1️⃣ Python Worker로 직접 채점 요청 중..."

WORKER_RESPONSE=$(curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"images\": [\"$BASE64_IMAGE\"],
    \"userId\": 1771491306,
    \"userName\": \"테스트학생\",
    \"academyId\": 1,
    \"systemPrompt\": \"당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 채점하세요. JSON 형식으로 응답하세요.\",
    \"model\": \"gemini-2.5-flash-lite\",
    \"temperature\": 0.3,
    \"enableRAG\": false
  }")

echo ""
echo "2️⃣ Worker 응답:"
echo "$WORKER_RESPONSE" | jq . 2>/dev/null || echo "$WORKER_RESPONSE"

SUCCESS=$(echo "$WORKER_RESPONSE" | jq -r '.success // false' 2>/dev/null)

if [ "$SUCCESS" == "true" ]; then
  echo ""
  echo "✅ Worker 정상 응답!"
  
  TOTAL_Q=$(echo "$WORKER_RESPONSE" | jq -r '.results[0].grading.totalQuestions // 0')
  CORRECT=$(echo "$WORKER_RESPONSE" | jq -r '.results[0].grading.correctAnswers // 0')
  
  echo "   총 문제: $TOTAL_Q, 정답: $CORRECT"
  
  if [ "$TOTAL_Q" == "0" ]; then
    echo "   ❌ 문제: 이미지에서 문제를 인식하지 못함"
  else
    SCORE=$((CORRECT * 100 / TOTAL_Q))
    echo "   점수: $SCORE점"
  fi
else
  echo ""
  echo "❌ Worker 오류 또는 실패"
fi

echo "=========================================="

