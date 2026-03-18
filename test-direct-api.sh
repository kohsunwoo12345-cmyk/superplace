#!/bin/bash

echo "=== 직접 API 테스트 ==="
echo ""

# 1. 출석 API로 실제 학생 정보 가져오기
echo "1️⃣ 출석 API 호출..."
ATTENDANCE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify-phone" \
  -H "Content-Type: application/json" \
  -d '{"phone":"01051363624"}')

echo "$ATTENDANCE" | jq '.'
echo ""

# 학생 ID 추출
STUDENT_ID=$(echo "$ATTENDANCE" | jq -r '.student.id')
STUDENT_PHONE=$(echo "$ATTENDANCE" | jq -r '.student.phone')
STUDENT_NAME=$(echo "$ATTENDANCE" | jq -r '.student.name')

echo "추출된 정보:"
echo "  ID: $STUDENT_ID"
echo "  Phone: $STUDENT_PHONE"
echo "  Name: $STUDENT_NAME"
echo ""

# 2. 매우 작은 테스트 이미지 생성 (1x1 투명 PNG)
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# 3. 숙제 제출 API 테스트 (여러 조합 시도)
echo "2️⃣ 숙제 제출 API 테스트..."
echo ""

# 테스트 1: userId + phone
echo "테스트 A: userId + phone"
RESULT_A=$(curl -s -X POST "https://suplacestudy.com/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$STUDENT_ID\",\"phone\":\"$STUDENT_PHONE\",\"images\":[\"$TEST_IMAGE\"]}")
echo "$RESULT_A" | jq '.'
echo ""

# 테스트 2: userId만
echo "테스트 B: userId만"
RESULT_B=$(curl -s -X POST "https://suplacestudy.com/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$STUDENT_ID\",\"images\":[\"$TEST_IMAGE\"]}")
echo "$RESULT_B" | jq '.'
echo ""

# 테스트 3: phone만 (userId 없이)
echo "테스트 C: phone만"
RESULT_C=$(curl -s -X POST "https://suplacestudy.com/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$STUDENT_PHONE\",\"images\":[\"$TEST_IMAGE\"]}")
echo "$RESULT_C" | jq '.'
echo ""

# 결과 분석
if echo "$RESULT_A" | jq -e '.success == true' > /dev/null; then
  echo "✅ 테스트 A 성공!"
elif echo "$RESULT_B" | jq -e '.success == true' > /dev/null; then
  echo "✅ 테스트 B 성공!"
elif echo "$RESULT_C" | jq -e '.success == true' > /dev/null; then
  echo "✅ 테스트 C 성공!"
else
  echo "❌ 모든 테스트 실패"
  echo ""
  echo "에러 메시지:"
  echo "A: $(echo "$RESULT_A" | jq -r '.error // "N/A"')"
  echo "B: $(echo "$RESULT_B" | jq -r '.error // "N/A"')"
  echo "C: $(echo "$RESULT_C" | jq -r '.error // "N/A"')"
fi
