#!/bin/bash

TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo "==================================="
echo "🔍 모든 제출 상세 확인"
echo "==================================="

echo -e "\n📊 오늘(2026-03-14) 제출 목록:"
curl -s "https://superplacestudy.pages.dev/api/homework/results?date=2026-03-14" \
  -H "Authorization: Bearer $TOKEN" | jq '.results[] | {
  id: .submission.id,
  userName: .submission.userName,
  status: .submission.status,
  imageCount: .submission.imageCount,
  score: .grading.score,
  subject: .grading.subject,
  feedback_length: (.grading.feedback | length),
  strengths_length: (.grading.strengths | length),
  has_gradingResult: (.grading != null)
}' | head -100

echo -e "\n==================================="
echo "📋 DB에서 gradingResult 직접 확인"
echo "==================================="

# 최신 제출 5개의 gradingResult 확인
curl -s "https://superplacestudy.pages.dev/api/homework/results?date=2026-03-14" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.results[0:5][] | 
  "
ID: \(.submission.id)
상태: \(.submission.status)
점수: \(.grading.score // "null")
과목: \(.grading.subject // "null")
피드백: \(.grading.feedback // "없음")
강점: \(.grading.strengths // "없음")
---"'

