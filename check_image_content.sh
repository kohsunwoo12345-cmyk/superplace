#!/bin/bash

TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo "==================================="
echo "🖼️ 제출된 이미지 확인"
echo "==================================="

# pending 상태가 아닌 최신 제출
SUBMISSION_ID="homework-1773434777493-bvs8qco96"

echo -e "\n📍 제출 ID: $SUBMISSION_ID"
echo ""

# 이미지 가져오기
curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '{
  success,
  count,
  image_preview: .images[0].imageData[0:200]
}'

echo -e "\n==================================="
echo "📊 제출 상세 정보"
echo "==================================="

curl -s "https://superplacestudy.pages.dev/api/homework/results?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.results[0] | {
  submission: {
    id: .submission.id,
    status: .submission.status,
    submittedAt: .submission.submittedAt,
    imageUrl_preview: .submission.imageUrl[0:200]
  },
  grading: {
    score: .grading.score,
    subject: .grading.subject,
    totalQuestions: .grading.totalQuestions,
    correctAnswers: .grading.correctAnswers
  }
}'

