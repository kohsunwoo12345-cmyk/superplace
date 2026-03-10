#!/bin/bash

echo "=== 숙제 채점 AI 설정 확인 및 테스트 ==="
echo ""

CONFIG_URL="https://superplacestudy.pages.dev/api/admin/homework-grading-config"

echo "1️⃣  현재 설정 조회"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CURRENT_CONFIG=$(curl -s "$CONFIG_URL")
echo "$CURRENT_CONFIG" | jq '.'

CURRENT_MODEL=$(echo "$CURRENT_CONFIG" | jq -r '.config.model // "없음"')
echo ""
echo "현재 모델: $CURRENT_MODEL"
echo ""

echo "2️⃣  DeepSeek 모델로 설정 업데이트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

UPDATE_RESPONSE=$(curl -s -X POST "$CONFIG_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "systemPrompt": "당신은 전문 교사입니다. 제공된 숙제 이미지를 정확하게 분석하여 채점하세요. 이미지에서 텍스트를 추출하고, 문제를 식별하며, 학생의 답안을 평가하세요.",
    "temperature": 0.3,
    "maxTokens": 4000,
    "topK": 40,
    "topP": 0.95,
    "enableRAG": 0
  }')

echo "$UPDATE_RESPONSE" | jq '.'
echo ""

echo "3️⃣  설정 재확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

VERIFY_CONFIG=$(curl -s "$CONFIG_URL")
echo "$VERIFY_CONFIG" | jq '.config | {model, temperature, enableRAG}'

UPDATED_MODEL=$(echo "$VERIFY_CONFIG" | jq -r '.config.model')
echo ""
echo "✅ 설정 완료: $UPDATED_MODEL"
echo ""

echo "4️⃣  실제 숙제 제출 및 채점 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SUBMIT_URL="https://superplacestudy.pages.dev/api/homework/submit"
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "제출 중..."
SUBMIT_RESPONSE=$(curl -s -X POST "$SUBMIT_URL" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": 1, \"images\": [\"$TEST_IMAGE\"]}")

echo "$SUBMIT_RESPONSE" | jq '.'
SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id')

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ 제출 실패"
  exit 1
fi

echo ""
echo "제출 ID: $SUBMISSION_ID"
echo "백그라운드 채점 대기 (15초)..."

for i in {15..1}; do
  printf "\r남은 시간: %2d초" $i
  sleep 1
done
echo ""
echo ""

echo "5️⃣  채점 결과 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STATUS_URL="https://superplacestudy.pages.dev/api/homework/status/$SUBMISSION_ID"
STATUS_RESPONSE=$(curl -s "$STATUS_URL")

echo "$STATUS_RESPONSE" | jq '.'

GRADING_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
echo ""

if [ "$GRADING_STATUS" = "graded" ]; then
  SCORE=$(echo "$STATUS_RESPONSE" | jq -r '.grading.score')
  SUBJECT=$(echo "$STATUS_RESPONSE" | jq -r '.grading.subject')
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎉 자동 채점 성공!"
  echo "📊 점수: $SCORE점"
  echo "📚 과목: $SUBJECT"
  echo "🤖 모델: $UPDATED_MODEL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
elif [ "$GRADING_STATUS" = "pending" ]; then
  echo "⏳ 아직 채점 중... (20초 추가 대기)"
  sleep 20
  
  STATUS_RESPONSE2=$(curl -s "$STATUS_URL")
  GRADING_STATUS2=$(echo "$STATUS_RESPONSE2" | jq -r '.status')
  
  if [ "$GRADING_STATUS2" = "graded" ]; then
    SCORE=$(echo "$STATUS_RESPONSE2" | jq -r '.grading.score')
    echo "✅ 채점 완료 (지연): $SCORE점"
  else
    echo "❌ 채점 미완료: $GRADING_STATUS2"
  fi
else
  echo "❌ 채점 실패: $GRADING_STATUS"
fi

echo ""
echo "=== 테스트 완료 ==="

