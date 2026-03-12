#!/bin/bash
set -e

echo "=========================================="
echo "🧪 전체 시스템 통합 테스트"
echo "=========================================="
echo ""

BASE_URL="https://superplacestudy.pages.dev"
PYTHON_WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
STUDENT_ID="student-1772865101424-12ldfjns29zg"

# 1. Python Worker 테스트
echo "1️⃣ Python Worker 테스트..."
PYTHON_TEST=$(curl -s -X POST "${PYTHON_WORKER_URL}/solve" \
  -H "Content-Type: application/json" \
  -d '{"equation": "3 + 5"}')

echo "Python 응답: $PYTHON_TEST"
echo ""

# 2. RAG 설정 확인
echo "2️⃣ RAG 설정 확인..."
CONFIG=$(curl -s "${BASE_URL}/api/admin/homework-grading-config")
echo "enableRAG: $(echo "$CONFIG" | jq -r '.config.enableRAG')"
echo "knowledgeBase length: $(echo "$CONFIG" | jq -r '.config.knowledgeBase | length // 0')"
echo "모델: $(echo "$CONFIG" | jq -r '.config.model')"
echo "프롬프트 길이: $(echo "$CONFIG" | jq -r '.config.systemPrompt | length')자"
echo ""

# 3. 실제 숙제 이미지를 Base64로 인코딩
echo "3️⃣ 숙제 이미지 준비 중..."
if [ -f homework_test.jpg ]; then
  IMAGE_B64=$(base64 -w 0 homework_test.jpg)
  IMAGE_SIZE=$(echo -n "$IMAGE_B64" | wc -c)
  echo "이미지 크기: $((IMAGE_SIZE / 1024))KB"
  IMAGE_DATA="data:image/jpeg;base64,${IMAGE_B64}"
else
  echo "❌ homework_test.jpg 파일이 없습니다!"
  exit 1
fi
echo ""

# 4. 숙제 제출
echo "4️⃣ 숙제 제출 중..."
SUBMIT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${STUDENT_ID}\",
    \"studentName\": \"정유빈\",
    \"images\": [\"${IMAGE_DATA}\"],
    \"subject\": \"수학\",
    \"grade\": 3,
    \"assignmentType\": \"homework\"
  }")

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id // empty')

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ 숙제 제출 실패!"
  echo "$SUBMIT_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ 제출 ID: $SUBMISSION_ID"
echo ""

# 5. 채점 대기 및 결과 확인
echo "5️⃣ 채점 대기 중 (최대 60초)..."
for i in {1..12}; do
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
    
    echo "=========================================="
    echo "📊 채점 결과"
    echo "=========================================="
    echo "점수: $SCORE"
    echo "과목: $SUBJECT"
    echo "전체 문제: $TOTAL_Q"
    echo "맞은 문제: $CORRECT"
    echo "문제 분석: $PROBLEM_COUNT 개"
    echo ""
    
    echo "피드백:"
    echo "$STATUS" | jq -r '.grading.feedback'
    echo ""
    
    echo "상세 분석:"
    echo "$STATUS" | jq -r '.grading.detailedAnalysis'
    echo ""
    
    if [ "$PROBLEM_COUNT" -gt 0 ]; then
      echo "=========================================="
      echo "📝 문제별 상세 분석"
      echo "=========================================="
      echo "$STATUS" | jq -r '.grading.problemAnalysis[] | "문제 \(.page // .questionNumber): \(if .isCorrect then "✅ 정답" else "❌ 오답" end)\n  학생 답안: \(.answer)\n  설명: \(.explanation)\n"'
      echo ""
      
      echo "✅ 성공! 문제별 상세 분석이 나왔습니다!"
      exit 0
    else
      echo "⚠️  경고: 문제 분석이 비어 있습니다!"
      echo ""
      echo "전체 응답:"
      echo "$STATUS" | jq '.grading'
      exit 1
    fi
  fi
  
  echo "($GRADING_STATUS)"
done

echo ""
echo "⏰ 타임아웃!"
echo "제출 ID: $SUBMISSION_ID"
echo "수동 확인: ${BASE_URL}/api/homework/status/${SUBMISSION_ID}"
exit 1
