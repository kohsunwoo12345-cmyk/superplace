#!/bin/bash

echo "==================================="
echo "⏳ Cloudflare Pages 배포 대기 중..."
echo "==================================="
sleep 120

echo -e "\n==================================="
echo "🎯 최종 실전 테스트 시작!"
echo "==================================="

TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

# 1. 새 숙제 제출
echo -e "\n📝 [1/5] 신규 숙제 제출..."
SUBMIT=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "student-1771491307268-zavs7u5t0",
    "code": "999888",
    "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC"]
  }')

SUBMISSION_ID=$(echo "$SUBMIT" | jq -r '.submission.id')
echo "제출 ID: $SUBMISSION_ID"
echo "$SUBMIT" | jq '{success, studentName: .submission.studentName, imageCount: .submission.imageCount, status: .submission.status}'

# 2. 채점 대기
echo -e "\n⏳ [2/5] 채점 처리 대기 (15초)..."
sleep 15

# 3. 결과 조회 (특정 제출)
echo -e "\n📊 [3/5] 제출 결과 상세 조회..."
DETAIL=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$DETAIL" | jq '.'

# 4. 핵심 정보 추출
echo -e "\n==================================="
echo "📋 [4/5] 핵심 정보 확인"
echo "==================================="
echo "$DETAIL" | jq -r '.results[0] | "
✅ 학생 이름: \(.submission.userName // "❌ 없음")
📧 이메일: \(.submission.userEmail // "❌ 없음")
📊 상태: \(.submission.status)
🎯 점수: \(.grading.score // "❌ 없음")
📚 과목: \(.grading.subject // "❌ 없음")
💬 피드백: \(.grading.feedback[0:50] // "❌ 없음")...
🖼️ 이미지 개수: \(.submission.imageCount)
📅 제출 시간: \(.submission.submittedAt)
⏰ 채점 시간: \(.grading.gradedAt // "❌ 없음")
"'

# 5. 이미지 확인
echo -e "\n🖼️ [5/5] 이미지 데이터 확인..."
IMAGE=$(curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$IMAGE" | jq '{success, count, has_images: (.images | length > 0), first_image_size: (.images[0].imageData | length)}'

# 6. 전체 결과 통계
echo -e "\n📈 [보너스] 전체 통계..."
STATS=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer $TOKEN")

echo "$STATS" | jq '.statistics'

echo -e "\n==================================="
echo "✅ 최종 테스트 완료!"
echo "==================================="
echo ""
echo "🌐 웹 페이지 확인:"
echo "   https://superplacestudy.pages.dev/dashboard/homework/results/"
