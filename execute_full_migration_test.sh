#!/bin/bash

echo "============================================="
echo "   전체 마이그레이션 및 테스트 프로세스"
echo "============================================="

echo ""
echo "⏳ Cloudflare Pages 배포 대기 (120초)..."
sleep 120

echo ""
echo "=== 1️⃣ 데이터 마이그레이션 실행 ==="
MIGRATION_RESULT=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/migrate-data" \
  -H "Content-Type: application/json")

echo "$MIGRATION_RESULT" | jq '.' 2>&1

MIGRATED=$(echo "$MIGRATION_RESULT" | jq -r '.migrated // 0')
echo ""
echo "📊 마이그레이션 완료: ${MIGRATED}건"

sleep 3

echo ""
echo "=== 2️⃣ 전체 데이터 조회 테스트 ==="
RESULTS=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer student-1771491307268-zavs7u5t0|student-1771491307055@temp.superplace.com|student|129|$(date +%s)000")

echo "$RESULTS" | jq '{
  success: .success,
  error: .error,
  statistics: .statistics,
  sample_count: (.results | length),
  first_3: [.results[0:3][] | {
    name: .submission.userName,
    date: .submission.submittedAt,
    status: .submission.status,
    score: .grading.score,
    subject: .grading.subject,
    questions: .grading.totalQuestions,
    correct: .grading.correctAnswers
  }]
}' 2>&1

# 통계 추출
TOTAL=$(echo "$RESULTS" | jq -r '.statistics.total // 0')
GRADED=$(echo "$RESULTS" | jq -r '.statistics.graded // 0')
AVG_SCORE=$(echo "$RESULTS" | jq -r '.statistics.averageScore // 0')

echo ""
echo "📊 최종 통계:"
echo "   - 총 제출: ${TOTAL}건"
echo "   - 채점완료: ${GRADED}건"
echo "   - 평균점수: ${AVG_SCORE}점"

echo ""
echo "=== 3️⃣ 특정 학생 데이터 상세 조회 ==="
curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31&userId=student-1771491307268-zavs7u5t0" \
  -H "Authorization: Bearer student-1771491307268-zavs7u5t0|student-1771491307055@temp.superplace.com|student|129|$(date +%s)000" \
  | jq '{
    total: .statistics.total,
    recent_5: [.results[0:5][] | {
      date: .submission.submittedAt,
      score: .grading.score,
      feedback: .grading.feedback
    }]
  }' 2>&1

echo ""
echo "=== 4️⃣ 새로운 숙제 제출 및 채점 테스트 ==="

# 테스트 이미지 생성
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAP0WAgWgBGjVAAAAAElFTkSuQmCC"

echo "📤 숙제 제출 중..."
SUBMIT_RESULT=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"student-1771491307268-zavs7u5t0\",
    \"code\": \"TEST999\",
    \"images\": [\"data:image/png;base64,${TEST_IMAGE}\"]
  }")

echo "$SUBMIT_RESULT" | jq '{
  success: .success,
  error: .error,
  submission_id: .submission.id,
  status: .submission.status,
  grading_score: .results[0].grading.score
}' 2>&1

SUBMIT_SUCCESS=$(echo "$SUBMIT_RESULT" | jq -r '.success // false')
SUBMISSION_ID=$(echo "$SUBMIT_RESULT" | jq -r '.submission.id // "none"')

if [ "$SUBMIT_SUCCESS" = "true" ]; then
  echo "✅ 제출 성공! ID: ${SUBMISSION_ID}"
else
  echo "❌ 제출 실패"
  echo "$SUBMIT_RESULT" | jq '.error, .message' 2>&1
fi

echo ""
echo "============================================="
echo "✅ 전체 테스트 완료!"
echo "============================================="
echo ""
echo "📝 요약:"
echo "   1. 마이그레이션: ${MIGRATED}건 → homework_submissions_v2"
echo "   2. 전체 데이터: ${TOTAL}건 (채점완료 ${GRADED}건)"
echo "   3. 평균 점수: ${AVG_SCORE}점"
echo "   4. 신규 제출: ${SUBMIT_SUCCESS}"
echo ""
echo "🌐 웹 페이지 확인:"
echo "   https://superplacestudy.pages.dev/dashboard/homework/results/"

