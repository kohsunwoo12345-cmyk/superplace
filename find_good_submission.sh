#!/bin/bash

TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo "==================================="
echo "🔍 피드백 있는 제출 찾기"
echo "==================================="

curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.results[] | 
  select(.grading.score != null and .grading.score > 0) | 
  select(.grading.strengths != null and .grading.strengths != "") |
  "\(.submission.id): \(.grading.score)점, 피드백: \(.grading.strengths[0:50])..."' | head -5

echo -e "\n==================================="
echo "📊 30점 제출의 상세 정보"
echo "==================================="

curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer $TOKEN" | jq '.results[] | 
  select(.grading.score == 30) | 
  {
    id: .submission.id,
    score: .grading.score,
    subject: .grading.subject,
    totalQuestions: .grading.totalQuestions,
    correctAnswers: .grading.correctAnswers,
    feedback: .grading.feedback,
    strengths: .grading.strengths,
    improvements: .grading.improvements,
    has_detailedResults: (.grading.detailedResults != null)
  }' | head -50

