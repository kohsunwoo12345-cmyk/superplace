#!/bin/bash

echo "=== 이미지 데이터 확인 ==="

# 특정 submission의 이미지 확인
curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=homework-1773421092978-7o4zxcb7c" \
  | jq '{
    success: .success,
    error: .error,
    count: .count,
    has_images: (.images | length > 0)
  }' 2>&1

echo ""
echo "=== results API의 이미지 조회 로직 확인 ==="
curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2026-03-14&endDate=2026-03-14&userId=student-1771491307268-zavs7u5t0" \
  -H "Authorization: Bearer student-1771491307268-zavs7u5t0|student-1771491307055@temp.superplace.com|student|129|$(date +%s)000" \
  | jq '.results[] | select(.submission.id == "homework-1773421092978-7o4zxcb7c") | {
    id: .submission.id,
    imageUrl: .submission.imageUrl,
    images_count: (.submission.images | length),
    status: .submission.status
  }' 2>&1

