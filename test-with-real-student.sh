#!/bin/bash
set -e

echo "======================================"
echo "🧪 실제 학생 계정으로 채점 테스트"
echo "======================================"
echo ""

BASE_URL="https://superplacestudy.pages.dev"

# 실제 학생 ID 사용 (이전 테스트에서 확인한 ID)
STUDENT_ID="student-1772865101424-12ldfjns29zg"

echo "📋 사용할 학생 ID: $STUDENT_ID"
echo ""

# 1. 채점 설정 확인
echo "1️⃣ 채점 설정 확인..."
CONFIG=$(curl -s "${BASE_URL}/api/admin/homework-grading-config")
MODEL=$(echo "$CONFIG" | jq -r '.config.model // "null"')
TEMP=$(echo "$CONFIG" | jq -r '.config.temperature // "null"')
PROMPT_LEN=$(echo "$CONFIG" | jq -r '.config.systemPrompt | length')

echo "   모델: $MODEL"
echo "   온도: $TEMP"
echo "   프롬프트: ${PROMPT_LEN}자"
echo ""

if [ "$MODEL" == "null" ]; then
  echo "❌ 채점 설정을 불러올 수 없습니다!"
  exit 1
fi

# 2. Novita AI 키 확인
echo "2️⃣ 환경 변수 확인..."
DEBUG_INFO=$(curl -s "${BASE_URL}/api/homework/debug")
echo "$DEBUG_INFO" | jq -r '"   Novita_AI_API: \(.env.hasNovitaApiKey // false), GEMINI: \(.env.hasGeminiApiKey // false)"'
echo ""

# 3. 테스트 숙제 제출
echo "3️⃣ 테스트 숙제 제출..."
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjuAAAAAElFTkSuQmCC"

SUBMIT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$STUDENT_ID\",
    \"studentName\": \"테스트학생\",
    \"images\": [\"$TEST_IMAGE\"],
    \"subject\": \"수학\",
    \"grade\": 3,
    \"assignmentType\": \"homework\"
  }")

echo "$SUBMIT_RESPONSE" | jq '.'
echo ""

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id // .id // .submissionId // empty')

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ 숙제 제출 실패!"
  exit 1
fi

echo "✅ 제출 ID: $SUBMISSION_ID"
echo ""

# 4. 채점 대기
echo "4️⃣ 채점 결과 대기 (최대 60초)..."
for i in {1..12}; do
  sleep 5
  echo -n "   $((i*5))초... "
  
  GRADING=$(curl -s "${BASE_URL}/api/homework/status/${SUBMISSION_ID}")
  STATUS=$(echo "$GRADING" | jq -r '.status // "pending"')
  
  if [ "$STATUS" == "graded" ]; then
    echo "✅ 완료!"
    echo ""
    echo "📊 채점 결과:"
    echo "$GRADING" | jq '{
      score: .score,
      subject: .subject,
      totalQuestions: .totalQuestions,
      correctAnswers: .correctAnswers,
      feedback: .feedback,
      problemAnalysisCount: (.problemAnalysis | length)
    }'
    echo ""
    
    # detailedResults 확인 (관리자 프롬프트 적용 여부)
    DETAILED_COUNT=$(echo "$GRADING" | jq '.detailedResults | length // 0')
    PROBLEM_ANALYSIS_COUNT=$(echo "$GRADING" | jq '.problemAnalysis | length // 0')
    
    echo "📝 상세 결과:"
    echo "   detailedResults: $DETAILED_COUNT 개"
    echo "   problemAnalysis: $PROBLEM_ANALYSIS_COUNT 개"
    echo ""
    
    if [ "$DETAILED_COUNT" -gt 0 ]; then
      echo "✅ detailedResults가 포함되어 있습니다 (관리자 프롬프트 작동 중)"
      echo "$GRADING" | jq -r '.detailedResults[] | "   문제 \(.questionNumber): \(if .isCorrect then "✅" else "❌" end) \(.studentAnswer) (정답: \(.correctAnswer))"'
    elif [ "$PROBLEM_ANALYSIS_COUNT" -gt 0 ]; then
      echo "✅ problemAnalysis가 포함되어 있습니다"
      echo "$GRADING" | jq -r '.problemAnalysis[] | "   문제 \(.page // .questionNumber): \(if .isCorrect then "✅" else "❌" end)"'
    else
      echo "⚠️  문제별 분석이 비어 있습니다!"
    fi
    echo ""
    exit 0
  fi
  
  echo "($STATUS)"
done

echo ""
echo "⏰ 타임아웃!"
echo "   제출 ID: $SUBMISSION_ID"
echo "   수동 확인: ${BASE_URL}/api/homework/status/${SUBMISSION_ID}"
echo ""
