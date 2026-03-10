#!/bin/bash

echo "🧪 학생 출석 코드 API 테스트"
echo "=================================="

# 테스트용 학생 userId
TEST_USER_ID="1"

echo ""
echo "📡 출석 코드 조회 테스트..."
RESULT=$(curl -s "https://superplacestudy.pages.dev/api/students/attendance-code?userId=${TEST_USER_ID}")
echo "$RESULT" | jq '.'

if echo "$RESULT" | jq -e '.success' > /dev/null 2>&1; then
  ATTENDANCE_CODE=$(echo "$RESULT" | jq -r '.code')
  echo ""
  echo "✅ 출석 코드 조회 성공: $ATTENDANCE_CODE"
else
  echo ""
  echo "❌ 출석 코드 조회 실패"
fi

echo ""
echo "=================================="
