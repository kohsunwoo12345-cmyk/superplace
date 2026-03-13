#!/bin/bash

echo "============================================="
echo "   실제 웹 페이지 데이터 확인"
echo "============================================="

TOKEN="student-1771491307268-zavs7u5t0|student-1771491307055@temp.superplace.com|student|129|$(date +%s)000"

echo ""
echo "=== 1. 실제 API 응답 확인 (최근 데이터) ==="
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2026-03-14&endDate=2026-03-14" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE" | jq '.success, .error' 2>&1
echo ""

# 데이터 있는지 확인
HAS_DATA=$(echo "$RESPONSE" | jq '.results | length')
echo "조회된 데이터 개수: $HAS_DATA"

if [ "$HAS_DATA" -gt 0 ]; then
  echo ""
  echo "=== 첫 번째 제출 데이터 상세 ==="
  echo "$RESPONSE" | jq '.results[0] | {
    submission_id: .submission.id,
    userName: .submission.userName,
    userEmail: .submission.userEmail,
    submittedAt: .submission.submittedAt,
    status: .submission.status,
    imageCount: .submission.imageCount,
    grading_score: .grading.score,
    grading_feedback: .grading.feedback,
    grading_exists: (.grading != null)
  }' 2>&1
else
  echo "❌ 데이터가 없습니다!"
fi

echo ""
echo "=== 2. 전체 기간 조회 ==="
FULL_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer $TOKEN")

echo "$FULL_RESPONSE" | jq '{
  success: .success,
  statistics: .statistics,
  result_count: (.results | length)
}' 2>&1

echo ""
echo "=== 3. 실제 이름이 있는 데이터 찾기 ==="
echo "$FULL_RESPONSE" | jq '[.results[] | select(.submission.userName != null and .submission.userName != "")] | .[0:3] | .[] | {
  id: .submission.id,
  name: .submission.userName,
  email: .submission.userEmail,
  status: .submission.status,
  score: .grading.score
}' 2>&1

echo ""
echo "=== 4. 이미지가 있는 데이터 찾기 ==="
echo "$FULL_RESPONSE" | jq '[.results[] | select(.submission.imageCount > 0)] | .[0:2] | .[] | {
  id: .submission.id,
  name: .submission.userName,
  imageCount: .submission.imageCount,
  status: .submission.status
}' 2>&1

