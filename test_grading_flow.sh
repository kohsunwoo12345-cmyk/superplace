#!/bin/bash

TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo "==================================="
echo "🧪 숙제 제출 및 채점 흐름 테스트"
echo "==================================="

# 1. 새 숙제 제출
echo -e "\n📝 [1/4] 숙제 제출..."
SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "student-1771491307268-zavs7u5t0",
    "code": "TEST999",
    "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC"]
  }')

echo "$SUBMIT_RESPONSE" | jq '.'

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id')
echo -e "\n✅ 제출 ID: $SUBMISSION_ID"

# 2. 채점 응답 확인
echo -e "\n📊 [2/4] 채점 결과 확인..."
echo "$SUBMIT_RESPONSE" | jq '{
  success,
  message,
  submission: {
    id: .submission.id,
    studentName: .submission.studentName,
    status: .submission.status,
    imageCount: .submission.imageCount
  },
  results: .results | length,
  first_result: .results[0] | {
    subject,
    ocrText: .ocrText[0:100],
    grading: .grading,
    ragContext: .ragContext | length
  }
}'

# 3. DB에서 확인
echo -e "\n🗄️ [3/4] DB에서 제출 데이터 확인..."
sleep 5
curl -s "https://superplacestudy.pages.dev/api/homework/results?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '{
  success,
  results: .results[0] | {
    submission: {
      id: .submission.id,
      userName: .submission.userName,
      status: .submission.status,
      imageCount: .submission.imageCount
    },
    grading: {
      score: .grading.score,
      subject: .grading.subject,
      totalQuestions: .grading.totalQuestions,
      correctAnswers: .grading.correctAnswers,
      feedback: .grading.feedback[0:100],
      strengths: .grading.strengths[0:100],
      improvements: .grading.improvements[0:100]
    }
  }
}'

# 4. Python Worker 로그 확인 (간접적)
echo -e "\n🔍 [4/4] 채점 완료 여부 확인..."
curl -s "https://superplacestudy.pages.dev/api/homework/results?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -r '
if .results[0].grading.score != null then
  "✅ 채점 완료: \(.results[0].grading.score)점"
else
  "⚠️ 채점 대기 중 또는 실패"
end
'

echo -e "\n==================================="
echo "✅ 테스트 완료!"
echo "==================================="
