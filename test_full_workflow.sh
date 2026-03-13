#!/bin/bash

echo "🧪 전체 워크플로우 테스트"
echo "======================================"

# 테스트 이미지 (간단한 수학 문제 텍스트 이미지로 대체)
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo ""
echo "1️⃣ 숙제 제출 (백그라운드 자동 채점 시작)"
echo "  URL: https://superplace.pages.dev/api/homework/submit"

SUBMIT_RESPONSE=$(curl -s -X POST https://superplace.pages.dev/api/homework/submit \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": 1771491306,
    \"code\": \"TEST-$(date +%s)\",
    \"images\": [\"$TEST_IMAGE\"]
  }")

echo "$SUBMIT_RESPONSE" | jq '.'

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id')

if [ "$SUBMISSION_ID" != "null" ] && [ -n "$SUBMISSION_ID" ]; then
  echo ""
  echo "✅ 제출 완료: $SUBMISSION_ID"
  echo ""
  echo "2️⃣ 10초 대기 (백그라운드 채점 진행)"
  for i in {10..1}; do
    echo -ne "  ⏳ $i초 남음...\r"
    sleep 1
  done
  echo ""
  
  echo ""
  echo "3️⃣ 결과 조회"
  echo "  결과 페이지를 브라우저에서 확인하세요:"
  echo "  https://superplace.pages.dev/dashboard/homework/results/"
  echo ""
  echo "  채점 결과 확인 사항:"
  echo "  - 점수가 0점이 아닌 실제 점수로 표시되는지"
  echo "  - AI채점하기 버튼이 없는지"
  echo "  - 문제별 분석이 정답/오답만 표시되는지"
  echo "  - 개선할 점이 간결한지 (40토큰 이내)"
else
  echo "❌ 제출 실패"
fi

echo ""
echo "✅ 테스트 완료"
