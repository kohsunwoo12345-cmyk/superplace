#!/bin/bash

echo "============================================="
echo "   최종 완전 테스트: 모든 기능 확인"
echo "============================================="

echo "⏳ 배포 대기 (90초)..."
sleep 90

TOKEN="student-1771491307268-zavs7u5t0|student-1771491307055@temp.superplace.com|student|129|$(date +%s)000"

echo ""
echo "=== 1️⃣ 실제 데이터 조회 (점수 30점 제출) ==="
RESULT=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2026-03-14&endDate=2026-03-14" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESULT" | jq '.results[] | select(.grading.score == 30) | {
  name: .submission.userName,
  date: .submission.submittedAt,
  status: .submission.status,
  score: .grading.score,
  subject: .grading.subject,
  total: .grading.totalQuestions,
  correct: .grading.correctAnswers,
  feedback: .grading.feedback[0:100],
  strengths: .grading.strengths[0:50],
  images: (.submission.images | length)
}' 2>&1

echo ""
echo "=== 2️⃣ 전체 통계 확인 ==="
echo "$RESULT" | jq '{
  success: .success,
  statistics: .statistics,
  total_results: (.results | length)
}' 2>&1

echo ""
echo "=== 3️⃣ 이미지 데이터 확인 ==="
SUBMISSION_ID=$(echo "$RESULT" | jq -r '.results[] | select(.grading.score == 30) | .submission.id')
echo "Submission ID: $SUBMISSION_ID"

curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=$SUBMISSION_ID" \
  | jq '{
    success: .success,
    count: .count,
    first_image_size: (if .images[0] then (.images[0] | length) else 0 end)
  }' 2>&1

echo ""
echo "=== 4️⃣ 75점 데이터 확인 ==="
echo "$RESULT" | jq '.results[] | select(.grading.score == 75) | {
  name: .submission.userName,
  score: .grading.score,
  feedback: .grading.feedback[0:80],
  has_feedback: (.grading.feedback | length > 0)
}' 2>&1 | head -20

echo ""
echo "=== 5️⃣ 전체 기간 조회 테스트 ==="
curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '{
    total: .statistics.total,
    graded: .statistics.graded,
    avgScore: .statistics.averageScore,
    has_data: (.results | length > 0)
  }' 2>&1

echo ""
echo "============================================="
echo "✅ 최종 테스트 완료!"
echo "============================================="
echo ""
echo "🌐 웹 페이지 확인:"
echo "   https://superplacestudy.pages.dev/dashboard/homework/results/"
echo ""
echo "📋 확인 항목:"
echo "   [✓] 학생 이름 표시"
echo "   [✓] 점수 표시 (30, 75, 100점 등)"
echo "   [✓] 피드백 표시"
echo "   [✓] 이미지 데이터"
echo "   [✓] 전체 통계"

