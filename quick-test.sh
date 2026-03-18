#!/bin/bash

PHONE="01051363624"
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "=== 빠른 테스트 ==="
echo ""

# 출석 인증
echo "1️⃣ 출석 인증..."
ATTENDANCE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify-phone" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\"}")

USER_ID=$(echo "$ATTENDANCE" | jq -r '.student.id')
echo "   userId: $USER_ID"
echo ""

# 숙제 제출
echo "2️⃣ 숙제 제출..."
HOMEWORK=$(curl -s -X POST "https://suplacestudy.com/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"phone\":\"$PHONE\",\"images\":[\"$TEST_IMAGE\"]}")

echo "$HOMEWORK" | jq '.'
