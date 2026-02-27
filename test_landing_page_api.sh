#!/bin/bash

echo "=== 랜딩페이지 API 테스트 ==="
echo ""

# 1. 목록 조회 테스트
echo "1. 목록 조회 테스트:"
curl -s "https://superplacestudy.pages.dev/api/admin/landing-pages" \
  -H "Authorization: Bearer test" | jq '.' || echo "API 오류"

echo ""
echo "2. 생성 테스트 (간단한 데이터):"

SLUG="test_$(date +%s)"
echo "Slug: $SLUG"

curl -s -X POST "https://superplacestudy.pages.dev/api/admin/landing-pages" \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d "{
    \"slug\": \"$SLUG\",
    \"title\": \"테스트 페이지\",
    \"studentId\": \"test-123\"
  }" | jq '.'

