#!/bin/bash

echo "🧪 숙제 제출 테스트"
echo "======================================"

# 1. 출석 코드로 사용자 정보 확인
CODE="402246"
echo "1️⃣ 출석 코드: $CODE"

# 2. 테스트 이미지 생성 (간단한 수학 문제)
BASE64_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo ""
echo "2️⃣ 숙제 제출 중..."

# 3. 숙제 제출
SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": 1771491306,
    \"code\": \"$CODE\",
    \"images\": [\"$BASE64_IMAGE\"]
  }")

echo "제출 응답:"
echo "$SUBMIT_RESPONSE" | jq . || echo "$SUBMIT_RESPONSE"

# 제출 ID 추출
SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id // empty')

if [ -n "$SUBMISSION_ID" ]; then
  echo ""
  echo "3️⃣ 제출 ID: $SUBMISSION_ID"
  echo "   30초 대기 중 (채점 완료까지)..."
  sleep 30
  
  echo ""
  echo "4️⃣ 결과 확인 중..."
  
  # DB에서 직접 확인할 수 없으므로 API로 확인
  echo "   제출된 숙제 기록 확인이 필요합니다."
  echo "   https://superplacestudy.pages.dev/dashboard/homework/results/ 에서 확인해주세요."
else
  echo "❌ 제출 실패"
fi

echo ""
echo "======================================"
echo "✅ 테스트 완료"
