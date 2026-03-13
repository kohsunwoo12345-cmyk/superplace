#!/bin/bash

echo "============================================="
echo "   최종 실제 테스트 - 이미지 저장 수정 후"
echo "============================================="

echo "⏳ 배포 대기 (120초)..."
sleep 120

TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAP0WAgWgBGjVAAAAAElFTkSuQmCC"

echo ""
echo "=== 1. 새로운 숙제 제출 (이미지 포함) ==="
SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"student-1771491307268-zavs7u5t0\",
    \"code\": \"FINAL_TEST_$(date +%s)\",
    \"images\": [\"data:image/png;base64,${TEST_IMAGE}\"]
  }")

echo "$SUBMIT_RESPONSE" | jq '{
  success: .success,
  submission_id: .submission.id,
  studentName: .submission.studentName,
  imageCount: .submission.imageCount,
  status: .submission.status
}' 2>&1

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id // "none"')
echo ""
echo "🆔 제출 ID: $SUBMISSION_ID"

if [ "$SUBMISSION_ID" = "none" ]; then
  echo "❌ 제출 실패!"
  exit 1
fi

echo ""
echo "⏳ 채점 대기 (3초)..."
sleep 3

echo ""
echo "=== 2. 이미지 API 확인 (homework_images 테이블) ==="
curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=$SUBMISSION_ID" \
  | jq '{
    success: .success,
    count: .count,
    has_images: ((.images | length) > 0),
    first_image_size: (if .images[0] then (.images[0] | length) else 0 end)
  }' 2>&1

echo ""
echo "=== 3. Results API 확인 (이미지 배열) ==="
TOKEN="student-1771491307268-zavs7u5t0|student-1771491307055@temp.superplace.com|student|129|$(date +%s)000"

curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2026-03-14&endDate=2026-03-14" \
  -H "Authorization: Bearer $TOKEN" \
  | jq ".results[] | select(.submission.id == \"$SUBMISSION_ID\") | {
    id: .submission.id,
    userName: .submission.userName,
    imageCount: .submission.imageCount,
    images_length: (.submission.images | length),
    status: .submission.status,
    score: .grading.score
  }" 2>&1

echo ""
echo "=== 4. 통계 확인 ==="
curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '{
    total: .statistics.total,
    graded: .statistics.graded,
    avgScore: .statistics.averageScore
  }' 2>&1

echo ""
echo "============================================="
echo "✅ 최종 실제 테스트 완료"
echo "============================================="
echo ""
echo "📋 확인 사항:"
echo "   1. submission.studentName: 학생 이름 표시"
echo "   2. /api/homework/images: 이미지 저장 확인"
echo "   3. /api/homework/results: 이미지 배열 로드 확인"
echo "   4. 통계: 전체 데이터 개수"

