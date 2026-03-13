#!/bin/bash

TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo "==================================="
echo "📊 점수 있는 기존 제출 확인"
echo "==================================="

# 30점짜리 제출 확인
SUBMISSION_ID="homework-1773421092978-7o4zxcb7c"

echo -e "\n🔍 제출 ID: $SUBMISSION_ID"
echo ""

curl -s "https://superplacestudy.pages.dev/api/homework/results?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '{
  submission: .results[0].submission | {
    id,
    userName,
    status,
    imageUrl: .imageUrl[0:100]
  },
  grading: .results[0].grading | {
    score,
    subject,
    totalQuestions,
    correctAnswers,
    feedback: .feedback[0:200],
    strengths: .strengths[0:200],
    improvements: .improvements[0:200]
  }
}'

echo -e "\n==================================="
echo "🖼️ 이미지 확인"
echo "==================================="

curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '{
  success,
  count,
  has_images: (.images | length > 0),
  image_size: (.images[0].imageData | length)
}'

