#!/bin/bash
set -e

echo "=========================================="
echo "🧪 숙제 채점 최종 테스트"
echo "=========================================="
echo ""

BASE_URL="https://superplacestudy.pages.dev"
STUDENT_ID="student-1772865101424-12ldfjns29zg"

# 1. 환경 변수 확인
echo "1️⃣ 환경 변수 확인..."
DEBUG=$(curl -s "${BASE_URL}/api/homework/debug")
echo "$DEBUG" | jq '{
  hasNovitaApiKey: .environment.hasNovitaApiKey,
  novitaKeyLength: .environment.novitaKeyLength,
  hasPythonWorker: false
}'
echo ""

# 2. 채점 설정 확인
echo "2️⃣ 채점 설정 확인..."
CONFIG=$(curl -s "${BASE_URL}/api/admin/homework-grading-config")
MODEL=$(echo "$CONFIG" | jq -r '.config.model')
echo "   모델: $MODEL"
echo "   온도: $(echo "$CONFIG" | jq -r '.config.temperature')"
echo "   프롬프트 길이: $(echo "$CONFIG" | jq -r '.config.systemPrompt | length')자"
echo ""

# 3. 숙제 제출
echo "3️⃣ 새 숙제 제출..."
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjuAAAAAElFTkSuQmCC"

SUBMIT=$(curl -s -X POST "${BASE_URL}/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${STUDENT_ID}\",
    \"studentName\": \"정유빈\",
    \"images\": [\"$TEST_IMAGE\"],
    \"subject\": \"수학\",
    \"grade\": 3,
    \"assignmentType\": \"homework\"
  }")

SUBMISSION_ID=$(echo "$SUBMIT" | jq -r '.submission.id')
echo "   제출 ID: $SUBMISSION_ID"
echo ""

# 4. 채점 대기 및 결과 확인
echo "4️⃣ 채점 결과 대기 (최대 30초)..."
for i in {1..6}; do
  sleep 5
  echo -n "   $((i*5))초... "
  
  STATUS=$(curl -s "${BASE_URL}/api/homework/status/${SUBMISSION_ID}")
  GRADING_STATUS=$(echo "$STATUS" | jq -r '.status')
  
  if [ "$GRADING_STATUS" == "graded" ]; then
    echo "✅ 완료!"
    echo ""
    
    SCORE=$(echo "$STATUS" | jq -r '.grading.score')
    SUBJECT=$(echo "$STATUS" | jq -r '.grading.subject')
    TOTAL_Q=$(echo "$STATUS" | jq -r '.grading.totalQuestions')
    CORRECT=$(echo "$STATUS" | jq -r '.grading.correctAnswers')
    PROBLEM_COUNT=$(echo "$STATUS" | jq '.grading.problemAnalysis | length')
    
    echo "📊 채점 결과:"
    echo "   점수: $SCORE"
    echo "   과목: $SUBJECT"
    echo "   전체 문제: $TOTAL_Q"
    echo "   맞은 문제: $CORRECT"
    echo "   문제 분석: $PROBLEM_COUNT 개"
    echo ""
    
    # 기본값 체크
    if [ "$SCORE" == "75" ] && [ "$SUBJECT" == "기타" ] && [ "$PROBLEM_COUNT" == "0" ]; then
      echo "⚠️  경고: 기본값이 반환되었습니다!"
      echo "   → Novita AI API 호출 실패 가능성"
      echo "   → Cloudflare Pages 로그 확인 필요"
      echo ""
      echo "🔍 디버깅 방법:"
      echo "   1. https://dash.cloudflare.com"
      echo "   2. Workers & Pages → superplace → Logs"
      echo "   3. 'DeepSeek API error' 또는 'JSON 파싱' 검색"
      echo ""
      exit 1
    else
      echo "✅ AI 채점 정상 작동!"
      echo ""
      
      if [ "$PROBLEM_COUNT" -gt 0 ]; then
        echo "📝 문제별 분석:"
        echo "$STATUS" | jq -r '.grading.problemAnalysis[] | "   문제 \(.page // .questionNumber): \(if .isCorrect then "✅ 정답" else "❌ 오답" end) - \(.explanation // "설명 없음")"'
      fi
      echo ""
      exit 0
    fi
  fi
  
  echo "($GRADING_STATUS)"
done

echo ""
echo "⏰ 타임아웃! 채점이 30초 내에 완료되지 않았습니다."
echo "   제출 ID: $SUBMISSION_ID"
echo "   수동 확인: ${BASE_URL}/api/homework/status/${SUBMISSION_ID}"
echo ""
exit 1
