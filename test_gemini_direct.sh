#!/bin/bash

TOKEN="Bearer student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo "=========================================="
echo "🔍 최근 제출된 숙제 확인"
echo "=========================================="
echo ""

# 최근 제출 내역 확인
RECENT=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2026-03-14&endDate=2026-03-14" \
  -H "Authorization: $TOKEN")

echo "📊 오늘 제출된 총 개수:"
echo "$RECENT" | jq '.results | length'

echo ""
echo "📋 최근 2개 제출 ID:"
echo "$RECENT" | jq -r '.results[0:2] | .[] | .submission.id'

echo ""
echo "=========================================="
echo "🖼️ 가장 최근 제출 이미지 데이터 확인"
echo "=========================================="
echo ""

LATEST_ID=$(echo "$RECENT" | jq -r '.results[0].submission.id')
echo "Submission ID: $LATEST_ID"

# 이미지 데이터 가져오기
IMAGE_DATA=$(curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=$LATEST_ID" \
  -H "Authorization: $TOKEN")

echo ""
echo "이미지 개수: $(echo "$IMAGE_DATA" | jq '.count')"
echo ""
echo "이미지 데이터 앞 100자:"
echo "$IMAGE_DATA" | jq -r '.images[0].imageData' | head -c 100
echo "..."

# Base64 이미지 추출
BASE64_IMAGE=$(echo "$IMAGE_DATA" | jq -r '.images[0].imageData')

echo ""
echo "=========================================="
echo "🔑 Gemini API 직접 테스트 (OCR)"
echo "=========================================="
echo ""

# Cloudflare Worker에서 사용하는 Gemini API 키 가져오기
# (환경 변수로 설정되어 있어야 함 - 실제 키는 Worker 환경에 있음)

# Worker를 통해 테스트
echo "Worker를 통한 채점 테스트..."
WORKER_RESPONSE=$(curl -s -X POST "https://physonsuperplacestudy.kohsunwoo12345.workers.dev/grade" \
  -H "X-API-Key: gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u" \
  -H "Content-Type: application/json" \
  -d "{
    \"images\": [\"$BASE64_IMAGE\"],
    \"userId\": \"test-user\"
  }")

echo ""
echo "Worker 응답:"
echo "$WORKER_RESPONSE" | jq '.'

echo ""
echo "=========================================="
echo "📊 OCR 결과 분석"
echo "=========================================="
echo ""

OCR_TEXT=$(echo "$WORKER_RESPONSE" | jq -r '.results[0].ocrText')
echo "OCR 추출 텍스트 길이: ${#OCR_TEXT}자"
echo ""
echo "OCR 텍스트 내용:"
echo "$OCR_TEXT"

echo ""
echo "=========================================="
echo "✍️ 채점 결과 분석"
echo "=========================================="
echo ""

echo "$WORKER_RESPONSE" | jq '.results[0].grading'

