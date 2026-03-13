#!/bin/bash

echo "🧪 /api/homework/grade 직접 테스트"
echo "======================================"

# 사용자 정보
USER_ID="student-1771491307268-zavs7u5t0"
CODE="402246"
TINY_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC"

echo "📤 직접 /api/homework/grade 호출..."
GRADE_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"code\": \"$CODE\",
    \"images\": [\"$TINY_IMAGE\"]
  }")

echo "$GRADE_RESPONSE" | jq '.'

SUCCESS=$(echo "$GRADE_RESPONSE" | jq -r '.success')
ERROR=$(echo "$GRADE_RESPONSE" | jq -r '.error // "none"')

echo ""
if [ "$SUCCESS" = "true" ]; then
    echo "✅ 채점 API 성공"
    SUBMISSION_ID=$(echo "$GRADE_RESPONSE" | jq -r '.submission.id')
    echo "제출 ID: $SUBMISSION_ID"
    
    echo ""
    echo "⏳ 10초 대기 후 결과 확인..."
    sleep 10
    
    RESULT=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
      -H "Authorization: Bearer 1|admin@superplace.co.kr|ADMIN|$(date +%s)000" | \
      jq --arg id "$SUBMISSION_ID" '.results[] | select(.submissionId == $id)')
    
    if [ -n "$RESULT" ]; then
        echo "$RESULT" | jq '{id, status, score: .grading.score, gradingId: .grading.id}'
    else
        echo "⚠️ 결과를 아직 찾을 수 없음"
    fi
else
    echo "❌ 채점 API 실패"
    echo "오류: $ERROR"
fi

