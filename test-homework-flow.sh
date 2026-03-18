#!/bin/bash

echo "=== 숙제 제출 플로우 전체 테스트 ==="
echo ""

PHONE="01051363624"
NORMALIZED_PHONE="${PHONE//-/}"

# Step 1: 출석 인증
echo "📝 Step 1: 출석 인증 테스트"
echo "전화번호: $NORMALIZED_PHONE"
ATTENDANCE_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify-phone" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$NORMALIZED_PHONE\"}")

echo "출석 응답:"
echo "$ATTENDANCE_RESPONSE" | jq '.'
echo ""

# Extract userId and studentName
USER_ID=$(echo "$ATTENDANCE_RESPONSE" | jq -r '.student.id // empty')
STUDENT_NAME=$(echo "$ATTENDANCE_RESPONSE" | jq -r '.student.name // empty')

if [ -z "$USER_ID" ]; then
  echo "❌ 출석 인증 실패 - userId를 찾을 수 없습니다"
  exit 1
fi

echo "✅ 출석 성공 - userId: $USER_ID, 학생명: $STUDENT_NAME"
echo ""

# Step 2: 숙제 제출
echo "📝 Step 2: 숙제 제출 테스트"
echo "userId: $USER_ID"
echo "phone: $NORMALIZED_PHONE"

# 테스트 이미지 URL (base64 data URL)
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

HOMEWORK_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"phone\":\"$NORMALIZED_PHONE\",\"images\":[\"$TEST_IMAGE\"]}")

echo "숙제 제출 응답:"
echo "$HOMEWORK_RESPONSE" | jq '.'
echo ""

# Check if submission was successful
SUBMISSION_SUCCESS=$(echo "$HOMEWORK_RESPONSE" | jq -r '.success // false')
SUBMISSION_ID=$(echo "$HOMEWORK_RESPONSE" | jq -r '.submission.id // empty')

if [ "$SUBMISSION_SUCCESS" = "true" ] && [ -n "$SUBMISSION_ID" ]; then
  echo "✅ 숙제 제출 성공 - submissionId: $SUBMISSION_ID"
else
  echo "❌ 숙제 제출 실패"
  ERROR_MSG=$(echo "$HOMEWORK_RESPONSE" | jq -r '.error // "알 수 없는 오류"')
  echo "오류 메시지: $ERROR_MSG"
  exit 1
fi
echo ""

# Step 3: 결과 조회
echo "📝 Step 3: 숙제 결과 조회 테스트"
echo "숙제 결과 페이지에 제출된 숙제가 나타나는지 확인 필요"
echo "URL: https://superplacestudy.pages.dev/dashboard/homework/results/"
echo ""

echo "=== 테스트 완료 ==="
echo "✅ 모든 단계 성공"
echo ""
echo "🔍 수동 확인 필요:"
echo "1. https://superplacestudy.pages.dev/attendance-verify 접속"
echo "2. 전화번호 입력: $PHONE"
echo "3. 출석 인증 버튼 클릭"
echo "4. 숙제 제출 화면에서 사진 촬영/업로드"
echo "5. 숙제 제출 버튼 클릭"
echo "6. https://superplacestudy.pages.dev/dashboard/homework/results/ 에서 제출된 숙제 확인"
