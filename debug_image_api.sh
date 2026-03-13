#!/bin/bash

TOKEN="Bearer student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo "=========================================="
echo "🔍 이미지 API 응답 구조 확인"
echo "=========================================="
echo ""

# 최근 제출 ID
RECENT=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2026-03-14&endDate=2026-03-14" \
  -H "Authorization: $TOKEN")

LATEST_ID=$(echo "$RECENT" | jq -r '.results[0].submission.id')
echo "Submission ID: $LATEST_ID"

echo ""
echo "전체 이미지 API 응답:"
IMAGE_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=$LATEST_ID" \
  -H "Authorization: $TOKEN")

echo "$IMAGE_RESPONSE" | jq '.'

echo ""
echo "=========================================="
echo "📊 DB에서 직접 이미지 확인"
echo "=========================================="
echo ""

# 데이터베이스에서 이미지 확인
curl -s "https://superplacestudy.pages.dev/api/homework/results?submissionId=$LATEST_ID" \
  -H "Authorization: $TOKEN" | jq '.results[0] | {
    id: .submission.id,
    imageCount: .submission.imageCount,
    hasImages: (.images != null),
    imagesLength: (.images | length),
    firstImageSize: (if .images != null and (.images | length) > 0 then (.images[0].imageData | length) else 0 end)
  }'

