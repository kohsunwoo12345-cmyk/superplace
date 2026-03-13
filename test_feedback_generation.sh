#!/bin/bash

echo "==================================="
echo "⏳ Cloudflare Pages 배포 대기..."
echo "==================================="
sleep 120

TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo -e "\n==================================="
echo "📝 신규 제출 테스트"
echo "==================================="

SUBMIT=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "student-1771491307268-zavs7u5t0",
    "code": "FINAL_TEST",
    "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC"]
  }')

SUBMISSION_ID=$(echo "$SUBMIT" | jq -r '.submission.id')
echo "제출 ID: $SUBMISSION_ID"

echo -e "\n📊 제출 응답:"
echo "$SUBMIT" | jq '{
  success,
  studentName: .submission.studentName,
  status: .submission.status,
  result: .results[0] | {
    subject,
    ocrText,
    grading: {
      totalQuestions: .grading.totalQuestions,
      correctAnswers: .grading.correctAnswers,
      overallFeedback: .grading.overallFeedback,
      strengths: .grading.strengths,
      improvements: .grading.improvements
    }
  }
}'

echo -e "\n⏳ 5초 대기 후 결과 확인..."
sleep 5

echo -e "\n==================================="
echo "🔍 DB에서 결과 확인"
echo "==================================="

curl -s "https://superplacestudy.pages.dev/api/homework/results?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.results[0] | {
  submission: {
    id: .submission.id,
    userName: .submission.userName,
    status: .submission.status
  },
  grading: {
    score: .grading.score,
    subject: .grading.subject,
    totalQuestions: .grading.totalQuestions,
    correctAnswers: .grading.correctAnswers,
    feedback: .grading.feedback,
    strengths: .grading.strengths,
    improvements: .grading.improvements
  }
}'

echo -e "\n==================================="
echo "✅ 테스트 완료!"
echo "==================================="
echo ""
echo "🌐 웹 페이지에서 확인:"
echo "   https://superplacestudy.pages.dev/dashboard/homework/results/"
