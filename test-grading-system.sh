#!/bin/bash

echo "========================================="
echo "🧪 숙제 채점 시스템 테스트"
echo "========================================="
echo ""

# 1. 새로운 숙제 제출
echo "📝 1단계: 숙제 제출"
PHONE="01051363624"

SUBMIT_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/homework-v2/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"images\": [\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\"]
  }")

echo "응답:"
echo "$SUBMIT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SUBMIT_RESPONSE"
echo ""

# submissionId 추출
SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | grep -o '"id":"homework-[^"]*"' | cut -d'"' -f4)

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ 제출 실패"
  exit 1
fi

echo "✅ 제출 성공: $SUBMISSION_ID"
echo ""

# 2. 채점 완료 대기 (최대 30초)
echo "⏳ 2단계: 채점 대기 (최대 30초)"
for i in {1..6}; do
  echo "  체크 $i/6..."
  sleep 5
  
  # 채점 결과 확인
  GRADING_CHECK=$(curl -s "https://suplacestudy.com/api/homework/results" \
    -H "Authorization: Bearer test-token")
  
  if echo "$GRADING_CHECK" | grep -q "\"submissionId\":\"$SUBMISSION_ID\""; then
    # 점수 확인
    SCORE=$(echo "$GRADING_CHECK" | grep -o "\"score\":[0-9.]*" | head -1 | cut -d':' -f2)
    if [ ! -z "$SCORE" ] && [ "$SCORE" != "0" ]; then
      echo ""
      echo "✅✅✅ 채점 완료! ✅✅✅"
      echo ""
      echo "📊 결과:"
      echo "  - 제출 ID: $SUBMISSION_ID"
      echo "  - 점수: $SCORE점"
      echo ""
      exit 0
    fi
  fi
done

echo ""
echo "⚠️ 30초 내에 채점이 완료되지 않음"
echo "   (백그라운드에서 채점 진행 중일 수 있음)"
echo ""
echo "📝 제출 ID: $SUBMISSION_ID"
echo "   나중에 결과 페이지에서 확인하세요."
echo ""

