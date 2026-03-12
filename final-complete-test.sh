#!/bin/bash
set -e

echo "=========================================="
echo "🔍 전체 시스템 최종 테스트"
echo "=========================================="
echo ""

BASE_URL="https://superplacestudy.pages.dev"

# 1. 환경 변수 확인
echo "1️⃣ 환경 변수 확인..."
DEBUG_INFO=$(curl -s "${BASE_URL}/api/homework/debug")
echo "$DEBUG_INFO" | jq '{
  hasNovitaApiKey: .environment.hasNovitaApiKey,
  novitaKeyLength: .environment.novitaKeyLength,
  hasPythonWorker: (.environment.hasPythonWorkerUrl // false)
}'
echo ""

# 2. 채점 설정 확인
echo "2️⃣ 채점 설정 확인..."
CONFIG=$(curl -s "${BASE_URL}/api/admin/homework-grading-config")
echo "$CONFIG" | jq '{
  model: .config.model,
  temperature: .config.temperature,
  promptLength: (.config.systemPrompt | length)
}'
echo ""

# 3. 출석 통계 확인 (실제 학생)
echo "3️⃣ 출석 통계 확인 (학생: 정유빈)..."
STUDENT_ID="student-1772865101424-12ldfjns29zg"
ATTENDANCE=$(curl -s "${BASE_URL}/api/attendance/statistics?userId=${STUDENT_ID}")
echo "$ATTENDANCE" | jq '{
  success: .success,
  role: .role,
  attendanceDays: .attendanceDays,
  calendar: .calendar
}'
echo ""

# 4. 출석 통계 확인 (관리자)
echo "4️⃣ 출석 통계 확인 (관리자)..."
ADMIN_ATTENDANCE=$(curl -s "${BASE_URL}/api/attendance/statistics?userId=admin-test&academyId=1")
echo "$ADMIN_ATTENDANCE" | jq '{
  success: .success,
  totalStudents: .totalStudents,
  todayAttendance: .todayAttendance,
  monthAttendance: .monthAttendance,
  recentRecords: (.recentRecords | length)
}'
echo ""

echo "5️⃣ 최근 출석 레코드 샘플 (3개)..."
echo "$ADMIN_ATTENDANCE" | jq -r '.recentRecords[:3][] | "   \(.date) - \(.studentName): \(.status)"'
echo ""

# 5. 새 숙제 제출 및 채점 테스트
echo "6️⃣ 숙제 제출 및 채점 테스트..."
echo "   (10x10px 테스트 이미지 사용)"

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

SUBMISSION_ID=$(echo "$SUBMIT" | jq -r '.submission.id // empty')

if [ -z "$SUBMISSION_ID" ]; then
  echo "   ❌ 숙제 제출 실패!"
  echo "$SUBMIT" | jq '.'
  exit 1
fi

echo "   ✅ 제출 ID: $SUBMISSION_ID"
echo ""

# 채점 대기
echo "7️⃣ 채점 결과 대기 (최대 30초)..."
for i in {1..6}; do
  sleep 5
  echo -n "   $((i*5))초... "
  
  STATUS=$(curl -s "${BASE_URL}/api/homework/status/${SUBMISSION_ID}")
  GRADING_STATUS=$(echo "$STATUS" | jq -r '.status // "pending"')
  
  if [ "$GRADING_STATUS" == "graded" ]; then
    echo "✅ 완료!"
    echo ""
    echo "📊 채점 결과:"
    echo "$STATUS" | jq '{
      score: .grading.score,
      subject: .grading.subject,
      totalQuestions: .grading.totalQuestions,
      correctAnswers: .grading.correctAnswers,
      problemAnalysisCount: (.grading.problemAnalysis | length),
      detailedResultsCount: (.grading.detailedResults | length // 0)
    }'
    echo ""
    
    PROBLEM_COUNT=$(echo "$STATUS" | jq '.grading.problemAnalysis | length')
    if [ "$PROBLEM_COUNT" -gt 0 ]; then
      echo "✅ problemAnalysis에 $PROBLEM_COUNT 개 문제 포함됨"
      echo "$STATUS" | jq -r '.grading.problemAnalysis[] | "   문제 \(.page // .questionNumber): \(if .isCorrect then "✅ 정답" else "❌ 오답" end)"'
    else
      echo "⚠️  problemAnalysis가 비어 있음 (기본값 사용)"
    fi
    echo ""
    exit 0
  fi
  
  echo "($GRADING_STATUS)"
done

echo ""
echo "⏰ 타임아웃 (30초)"
echo "   제출 ID: $SUBMISSION_ID"
echo "   수동 확인: ${BASE_URL}/api/homework/status/${SUBMISSION_ID}"
echo ""
