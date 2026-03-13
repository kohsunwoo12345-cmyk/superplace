#!/bin/bash

echo "==================================="
echo "🧪 신규 숙제 제출 테스트"
echo "==================================="

# 토큰 (학생)
TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

# 1. 새 숙제 제출
echo -e "\n📝 Step 1: 새 숙제 제출..."
SUBMISSION_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "student-1771491307268-zavs7u5t0",
    "code": "123456",
    "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
  }')

echo "$SUBMISSION_RESPONSE" | jq '.'
SUBMISSION_ID=$(echo "$SUBMISSION_RESPONSE" | jq -r '.submission.id // empty')

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ 제출 실패!"
  exit 1
fi

echo -e "\n✅ 제출 완료! ID: $SUBMISSION_ID"

# 2. 10초 대기 (채점 처리 시간)
echo -e "\n⏳ 채점 처리 대기 (10초)..."
sleep 10

# 3. 제출 결과 확인
echo -e "\n📊 Step 2: 제출 결과 확인..."
RESULT=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESULT" | jq '.'

# 4. 핵심 정보 추출
echo -e "\n==================================="
echo "📋 제출 결과 요약"
echo "==================================="
echo "$RESULT" | jq -r '
  .results[0] | 
  "학생 이름: \(.submission.userName // "❌ 없음")",
  "이메일: \(.submission.userEmail // "❌ 없음")",
  "상태: \(.submission.status)",
  "점수: \(.grading.score // "❌ 없음")",
  "과목: \(.grading.subject // "❌ 없음")",
  "피드백: \(.grading.feedback // "❌ 없음")",
  "이미지 개수: \(.submission.imageCount)",
  "제출 시간: \(.submission.submittedAt)",
  "채점 시간: \(.grading.gradedAt // "❌ 없음")"
'

# 5. 이미지 확인
echo -e "\n🖼️ Step 3: 이미지 확인..."
IMAGE_RESULT=$(curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$IMAGE_RESULT" | jq '{success, count, has_images: (.images | length > 0)}'

echo -e "\n==================================="
echo "✅ 테스트 완료!"
echo "==================================="
