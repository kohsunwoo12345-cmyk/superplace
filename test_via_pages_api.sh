#!/bin/bash

echo "🧪 Pages API를 통한 숙제 채점 테스트"
echo "======================================"

# 테스트 이미지 (간단한 1x1 PNG)
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo ""
echo "📤 요청 전송:"
echo "  URL: https://superplace.pages.dev/api/homework/grade"
echo "  이미지: 테스트 이미지 1장"

curl -X POST https://superplace.pages.dev/api/homework/grade \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": 123,
    \"code\": \"TEST-$(date +%s)\",
    \"images\": [\"$TEST_IMAGE\"]
  }" \
  | jq '.' || echo "Response not JSON"

echo ""
echo "✅ 테스트 완료"
