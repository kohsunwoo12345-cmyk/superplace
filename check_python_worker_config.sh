#!/bin/bash

TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo "==================================="
echo "🔍 채점 설정 확인"
echo "==================================="

# grading_config 테이블 확인
echo -e "\n📊 현재 채점 설정:"
curl -s "https://superplacestudy.pages.dev/api/admin/grading-config" \
  -H "Authorization: Bearer admin-001|1773523200000|hash|1" 2>/dev/null | jq '.' || echo "설정 조회 실패"

echo -e "\n==================================="
echo "🐍 Python Worker 직접 테스트"
echo "==================================="

# 실제 문제 이미지 예시 (간단한 수학 문제 텍스트)
# "2 + 2 = ?" 라고 쓰여진 이미지 (가정)
echo -e "\n실제 숙제 이미지로 Python Worker 직접 호출..."

# 최근 제출된 실제 이미지 가져오기
RECENT_SUBMISSION=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?date=2026-03-14" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.results[] | select(.submission.status == "graded" and .submission.imageCount > 0) | .submission.id' | head -1)

echo "최근 제출 ID: $RECENT_SUBMISSION"

# 해당 제출의 이미지 가져오기
if [ ! -z "$RECENT_SUBMISSION" ]; then
  IMAGE_DATA=$(curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=$RECENT_SUBMISSION" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.images[0].imageData' 2>/dev/null)
  
  if [ ! -z "$IMAGE_DATA" ] && [ "$IMAGE_DATA" != "null" ]; then
    echo -e "\n✅ 실제 이미지 데이터 추출 성공"
    echo "이미지 크기: ${#IMAGE_DATA} bytes"
    echo "이미지 미리보기: ${IMAGE_DATA:0:100}..."
  else
    echo -e "\n❌ 이미지 데이터 추출 실패"
  fi
fi

echo -e "\n==================================="
echo "📋 최근 제출들의 OCR 결과"
echo "==================================="

curl -s "https://superplacestudy.pages.dev/api/homework/results?date=2026-03-14" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.results[0:5][] | 
  select(.submission.status == "graded") |
  "
ID: \(.submission.id)
상태: \(.submission.status)
과목: \(.grading.subject)
OCR 텍스트: (API 응답에 없음)
피드백: \(.grading.feedback)
---"'

