#!/bin/bash

echo "🧪 새 숙제 제출 및 AI 응답 확인..."
echo ""

PHONE="01051363624"

# 1. 숙제 제출
echo "1️⃣ 숙제 제출..."
SUBMIT_RESULT=$(curl -s -X POST "https://suplacestudy.com/api/homework-v2/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"images\": [\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\"]
  }")

SUBMISSION_ID=$(echo "$SUBMIT_RESULT" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('submission',{}).get('id',''))" 2>/dev/null)

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ 제출 실패"
  exit 1
fi

echo "✅ 제출 ID: $SUBMISSION_ID"
echo ""

# 2. 채점 대기
echo "⏳ 채점 대기 중 (15초)..."
sleep 15

# 3. AI 응답 조회
echo ""
echo "2️⃣ AI 응답 조회..."
TOKEN="test-token"
AI_DEBUG=$(curl -s "https://suplacestudy.com/api/homework/ai-debug?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "📊 AI 디버그 데이터:"
echo "$AI_DEBUG" | python3 -m json.tool

# AI 응답이 있으면 전체 텍스트 출력
HAS_RESPONSE=$(echo "$AI_DEBUG" | python3 -c "import sys,json; data=json.load(sys.stdin); print('yes' if data.get('responses') else 'no')" 2>/dev/null)

if [ "$HAS_RESPONSE" == "yes" ]; then
  echo ""
  echo "📄 AI 전체 응답:"
  echo "$AI_DEBUG" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('responses'):
    response = data['responses'][0].get('response', '')
    print(response[:2000])  # 처음 2000자만 출력
    if len(response) > 2000:
        print('... (생략)')
"
fi

echo ""
echo "✅ 테스트 완료"
