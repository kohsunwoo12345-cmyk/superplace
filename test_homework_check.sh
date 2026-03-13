#!/bin/bash

echo "🧪 숙제 검사 결과 페이지 테스트"
echo "======================================"

# 1. 결과 페이지 API 테스트
echo ""
echo "1️⃣ 숙제 결과 API 호출..."

curl -s "https://superplace.pages.dev/api/homework/results?date=$(date +%Y-%m-%d)" \
  -H "Accept: application/json" \
  | jq '.' 2>/dev/null || echo "API 응답 확인 필요"

echo ""
echo "======================================"
