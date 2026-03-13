#!/bin/bash

echo "==================================="
echo "🐍 Python Worker 직접 테스트"
echo "==================================="

WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev/grade"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

# 실제 숙제 이미지 데이터 (간단한 텍스트 이미지)
IMAGE_DATA="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC"

echo -e "\n📤 Python Worker 호출 중..."
echo "URL: $WORKER_URL"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"images\": [\"$IMAGE_DATA\"],
    \"userId\": 1771491307268,
    \"userName\": \"테스트학생\",
    \"academyId\": 129,
    \"systemPrompt\": \"당신은 숙제를 채점하는 AI입니다.\",
    \"model\": \"gemini-2.0-flash-exp\",
    \"temperature\": 0.7,
    \"enableRAG\": false
  }")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $HTTP_STATUS"
echo ""
echo "응답 본문:"
echo "$BODY" | jq '.'

echo -e "\n==================================="
echo "📊 응답 구조 분석"
echo "==================================="
echo "$BODY" | jq '{
  success,
  results_count: .results | length,
  first_result: .results[0] | {
    subject,
    ocrText_length: .ocrText | length,
    grading: .grading,
    has_feedback: (.grading.overallFeedback != null),
    has_strengths: (.grading.strengths != null),
    has_improvements: (.grading.improvements != null)
  }
}'

echo -e "\n==================================="
echo "🔍 피드백 확인"
echo "==================================="
echo "$BODY" | jq -r '.results[0].grading | {
  overallFeedback: .overallFeedback,
  strengths: .strengths,
  improvements: .improvements,
  detailedResults: .detailedResults
}'

