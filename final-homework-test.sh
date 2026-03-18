#!/bin/bash

echo "=== 숙제 제출 최종 테스트 (문자열 ID 지원) ==="
echo ""
echo "⏳ Cloudflare Pages 배포 대기 (180초)..."
sleep 180

PHONE="01051363624"
NORMALIZED_PHONE="${PHONE//-/}"

# Step 1: 출석 인증
echo ""
echo "📝 Step 1: 출석 인증"
ATTENDANCE_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify-phone" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$NORMALIZED_PHONE\"}")

USER_ID=$(echo "$ATTENDANCE_RESPONSE" | jq -r '.student.id // empty')
STUDENT_NAME=$(echo "$ATTENDANCE_RESPONSE" | jq -r '.student.name // empty')

if [ -z "$USER_ID" ]; then
  echo "❌ 출석 인증 실패"
  echo "$ATTENDANCE_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ userId: $USER_ID (타입: 문자열 ID)"
echo "✅ 학생명: $STUDENT_NAME"
echo ""

# Step 2: 숙제 제출
echo "📝 Step 2: 숙제 제출 (문자열 userId + phone 사용)"
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

HOMEWORK_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"phone\":\"$NORMALIZED_PHONE\",\"images\":[\"$TEST_IMAGE\"]}")

echo "숙제 제출 응답:"
echo "$HOMEWORK_RESPONSE" | jq '.'
echo ""

SUBMISSION_SUCCESS=$(echo "$HOMEWORK_RESPONSE" | jq -r '.success // false')
SUBMISSION_ID=$(echo "$HOMEWORK_RESPONSE" | jq -r '.submission.id // empty')

if [ "$SUBMISSION_SUCCESS" = "true" ] && [ -n "$SUBMISSION_ID" ]; then
  echo "✅ 숙제 제출 성공!"
  echo "   submissionId: $SUBMISSION_ID"
  echo "   학생명: $(echo "$HOMEWORK_RESPONSE" | jq -r '.submission.studentName')"
  echo "   제출 시간: $(echo "$HOMEWORK_RESPONSE" | jq -r '.submission.submittedAt')"
  echo ""
  echo "=== 테스트 완료 ✅ ==="
  echo ""
  echo "🌐 결과 확인:"
  echo "https://superplacestudy.pages.dev/dashboard/homework/results/"
else
  echo "❌ 숙제 제출 실패"
  ERROR=$(echo "$HOMEWORK_RESPONSE" | jq -r '.error // "알 수 없는 오류"')
  DETAILS=$(echo "$HOMEWORK_RESPONSE" | jq -r '.details // ""')
  echo "오류: $ERROR"
  [ -n "$DETAILS" ] && echo "상세: $DETAILS"
  exit 1
fi
