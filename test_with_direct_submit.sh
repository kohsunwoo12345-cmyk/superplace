#!/bin/bash

echo "🧪 Python Worker 직접 테스트"
echo "=========================================="

# Python Worker에 직접 채점 요청
WORKER_URL="https://physonsuperplacestudy-production.kohsunwoo12345.workers.dev/grade"
API_KEY="xL-fXyCJpmj-gupSAYr12YDIZ6Xy1lXUOUmihLMb"

# 간단한 테스트 이미지
BASE64_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAA3ElEQVR42u3RAQ0AAAjDMO5fNCCDkC5z0HTVriRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkvQ1GwAA//8DAEYQEwFjLQvsAAAAAElFTkSuQmCC"

echo "1️⃣ Python Worker로 직접 채점 요청 중..."
echo "   URL: $WORKER_URL"

WORKER_RESPONSE=$(curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"images\": [\"$BASE64_IMAGE\"],
    \"userId\": 1771491306,
    \"userName\": \"테스트학생\",
    \"academyId\": 1,
    \"systemPrompt\": \"당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 채점하세요. JSON 형식으로 응답하세요: {\\\"totalQuestions\\\": 숫자, \\\"correctAnswers\\\": 숫자, \\\"detailedResults\\\": [{\\\"questionNumber\\\": 1, \\\"isCorrect\\\": true/false}], \\\"overallFeedback\\\": \\\"피드백\\\", \\\"strengths\\\": \\\"강점\\\", \\\"improvements\\\": \\\"개선점\\\"}\",
    \"model\": \"gemini-2.5-flash-lite\",
    \"temperature\": 0.3,
    \"enableRAG\": false
  }")

echo ""
echo "2️⃣ Worker 응답:"
echo "$WORKER_RESPONSE" | jq . || echo "$WORKER_RESPONSE"

# 응답 분석
SUCCESS=$(echo "$WORKER_RESPONSE" | jq -r '.success // false')
RESULT_COUNT=$(echo "$WORKER_RESPONSE" | jq -r '.results | length // 0')

if [ "$SUCCESS" == "true" ]; then
  echo ""
  echo "✅ Worker 정상 응답"
  echo "   결과 개수: $RESULT_COUNT"
  
  # 첫 번째 결과 상세 정보
  TOTAL_Q=$(echo "$WORKER_RESPONSE" | jq -r '.results[0].grading.totalQuestions // 0')
  CORRECT=$(echo "$WORKER_RESPONSE" | jq -r '.results[0].grading.correctAnswers // 0')
  SUBJECT=$(echo "$WORKER_RESPONSE" | jq -r '.results[0].subject // "unknown"')
  
  echo "   총 문제 수: $TOTAL_Q"
  echo "   정답 수: $CORRECT"
  echo "   과목: $SUBJECT"
  
  if [ "$TOTAL_Q" == "0" ] || [ "$CORRECT" == "0" ]; then
    echo ""
    echo "❌ 문제: Worker가 문제를 인식하지 못했거나 0점으로 채점"
    echo "   → 이미지 OCR 실패 또는 프롬프트 문제"
  else
    CALC_SCORE=$((CORRECT * 100 / TOTAL_Q))
    echo "   계산된 점수: $CALC_SCORE점"
  fi
else
  echo ""
  echo "❌ Worker 오류"
  ERROR_MSG=$(echo "$WORKER_RESPONSE" | jq -r '.error // "알 수 없는 오류"')
  echo "   오류 메시지: $ERROR_MSG"
fi

echo ""
echo "=========================================="

