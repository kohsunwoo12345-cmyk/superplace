#!/bin/bash
set -e

echo "======================================"
echo "🧪 전체 숙제 채점 시스템 테스트"
echo "======================================"
echo ""

BASE_URL="https://superplacestudy.pages.dev"

# 1. 현재 채점 설정 확인
echo "1️⃣ 채점 설정 확인..."
CONFIG=$(curl -s "${BASE_URL}/api/admin/homework-grading-config")
echo "$CONFIG" | jq -r '"   모델: \(.model), 온도: \(.temperature), 프롬프트 길이: \(.systemPrompt | length)자"'
echo ""

PROMPT_PREVIEW=$(echo "$CONFIG" | jq -r '.systemPrompt' | head -c 300)
echo "   프롬프트 미리보기:"
echo "   $PROMPT_PREVIEW..."
echo ""

# 2. Novita AI 키 확인
echo "2️⃣ Novita API 키 확인..."
DEBUG_INFO=$(curl -s "${BASE_URL}/api/homework/debug")
HAS_NOVITA=$(echo "$DEBUG_INFO" | jq -r '.env.hasNovitaApiKey // false')

if [ "$HAS_NOVITA" == "true" ]; then
  echo "   ✅ Novita_AI_API 설정됨"
else
  echo "   ❌ Novita_AI_API 미설정"
  echo ""
  echo "⚠️  경고: Novita AI API 키가 없으면 채점이 작동하지 않습니다!"
  echo "   Cloudflare Pages → Settings → Environment variables에서 설정하세요."
fi
echo ""

# 3. 간단한 수학 문제 이미지 생성 (매우 작은 PNG)
echo "3️⃣ 테스트 숙제 제출..."
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjuAAAAAElFTkSuQmCC"

SUBMIT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"test-user-123\",
    \"studentName\": \"테스트학생\",
    \"images\": [\"$TEST_IMAGE\"],
    \"subject\": \"수학\",
    \"grade\": 3,
    \"assignmentType\": \"homework\"
  }")

echo "   제출 응답:"
echo "$SUBMIT_RESPONSE" | jq '.'
echo ""

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.id // .submissionId // empty')

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ 숙제 제출 실패!"
  exit 1
fi

echo "   ✅ 제출 ID: $SUBMISSION_ID"
echo ""

# 4. 채점 대기 (최대 60초)
echo "4️⃣ 채점 결과 대기 (최대 60초)..."
for i in {1..12}; do
  sleep 5
  echo -n "   $((i*5))초 경과... "
  
  GRADING_STATUS=$(curl -s "${BASE_URL}/api/homework/check-grading?submissionId=${SUBMISSION_ID}")
  
  STATUS=$(echo "$GRADING_STATUS" | jq -r '.status // "pending"')
  
  if [ "$STATUS" == "graded" ]; then
    echo ""
    echo "   ✅ 채점 완료!"
    echo ""
    echo "📊 채점 결과:"
    echo "$GRADING_STATUS" | jq '{
      score: .score,
      subject: .subject,
      totalQuestions: .totalQuestions,
      correctAnswers: .correctAnswers,
      feedback: .feedback,
      problemAnalysis: .problemAnalysis
    }'
    echo ""
    
    # problemAnalysis 상세 출력
    PROBLEM_COUNT=$(echo "$GRADING_STATUS" | jq '.problemAnalysis | length')
    if [ "$PROBLEM_COUNT" -gt 0 ]; then
      echo "📝 문제별 분석 ($PROBLEM_COUNT 문제):"
      echo "$GRADING_STATUS" | jq -r '.problemAnalysis[] | "   문제 \(.page // .questionNumber): \(.problem // "N/A") → \(if .isCorrect then "✅ 정답" else "❌ 오답" end) (\(.explanation // "설명 없음"))"'
    else
      echo "⚠️  문제별 분석이 비어 있습니다. 프롬프트가 제대로 적용되지 않았을 수 있습니다."
    fi
    echo ""
    exit 0
  fi
  
  echo "(상태: $STATUS)"
done

echo ""
echo "⏰ 타임아웃: 60초 내에 채점이 완료되지 않았습니다."
echo ""
echo "🔍 디버깅 정보:"
echo "   - Cloudflare Pages 로그 확인: https://dash.cloudflare.com → superplace → Logs"
echo "   - 제출 ID: $SUBMISSION_ID"
echo "   - 채점 상태 확인: ${BASE_URL}/api/homework/check-grading?submissionId=${SUBMISSION_ID}"
echo ""
