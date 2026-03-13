#!/bin/bash

TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo "📊 채점 완료된 데이터 확인..."
curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer $TOKEN" | jq '.results[] | select(.grading.score != null and .grading.score > 0) | {
  id: .submission.id,
  userName: .submission.userName,
  score: .grading.score,
  subject: .grading.subject,
  totalQuestions: .grading.totalQuestions,
  correctAnswers: .grading.correctAnswers,
  feedback: .grading.feedback[0:50]
}' | head -50

