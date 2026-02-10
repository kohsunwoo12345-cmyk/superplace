#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🧪 숙제 생성 API 테스트"
echo "====================================="
echo ""

# 1. 선생님 정보 확인 (DB에 존재하는지)
echo "1️⃣ 선생님 정보 확인"
echo "Teacher ID: 1 (admin@superplace.co.kr)"
echo ""

# 2. 학생 목록 조회
echo "2️⃣ 학생 목록 조회"
STUDENTS=$(curl -s "${BASE_URL}/api/students?academyId=1&role=TEACHER&userId=1")
echo "$STUDENTS"
STUDENT_ID=$(echo $STUDENTS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo ""
echo "첫 번째 학생 ID: $STUDENT_ID"
echo ""

# 3. 숙제 생성 시도
echo "3️⃣ 숙제 생성 시도"

HOMEWORK_DATA=$(cat <<JSON
{
  "teacherId": 1,
  "title": "테스트 숙제",
  "description": "API 테스트용 숙제입니다",
  "subject": "수학",
  "dueDate": "2026-02-15 23:59:00",
  "targetType": "specific",
  "targetStudents": [$STUDENT_ID]
}
JSON
)

echo "요청 데이터:"
echo "$HOMEWORK_DATA"
echo ""

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/homework/assignments/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "$HOMEWORK_DATA")

echo "응답:"
echo "$RESPONSE"
echo ""

echo "====================================="
