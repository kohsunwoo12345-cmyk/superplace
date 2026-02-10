#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🧪 숙제 생성 최종 테스트"
echo "====================================="
echo ""

# 배포 대기
echo "⏳ 배포 완료 대기 (90초)..."
sleep 90

echo "1️⃣ 학생 목록 조회"
STUDENTS=$(curl -s "${BASE_URL}/api/students?academyId=1&role=TEACHER&userId=1")
STUDENT_ID=$(echo $STUDENTS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
STUDENT_COUNT=$(echo $STUDENTS | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "✅ 학생 수: $STUDENT_COUNT"
echo "✅ 첫 번째 학생 ID: $STUDENT_ID"
echo ""

echo "2️⃣ 숙제 생성 테스트"
HOMEWORK_DATA=$(cat <<JSON
{
  "teacherId": 1,
  "title": "최종 테스트 숙제",
  "description": "DB 테이블 자동 생성 테스트",
  "subject": "수학",
  "dueDate": "2026-02-15 23:59:00",
  "targetType": "specific",
  "targetStudents": [$STUDENT_ID]
}
JSON
)

RESPONSE=$(curl -s -X POST "${BASE_URL}/api/homework/assignments/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "$HOMEWORK_DATA")

echo "$RESPONSE"
echo ""

SUCCESS=$(echo $RESPONSE | grep -o '"success":true' | wc -l)

if [ "$SUCCESS" -gt "0" ]; then
    ASSIGNMENT_ID=$(echo $RESPONSE | grep -o '"assignmentId":"[^"]*"' | cut -d'"' -f4)
    echo "✅ 성공! 숙제 생성됨"
    echo "   Assignment ID: $ASSIGNMENT_ID"
    echo ""
    
    # 3. 생성된 숙제 조회
    echo "3️⃣ 생성된 숙제 조회"
    ASSIGNMENTS=$(curl -s "${BASE_URL}/api/homework/assignments/teacher?teacherId=1&academyId=1")
    echo "$ASSIGNMENTS"
    echo ""
    
    ASSIGNMENT_COUNT=$(echo $ASSIGNMENTS | grep -o '"id":"assignment-' | wc -l)
    echo "✅ 총 숙제 수: $ASSIGNMENT_COUNT개"
else
    echo "❌ 실패! 에러 확인:"
    ERROR=$(echo $RESPONSE | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    MESSAGE=$(echo $RESPONSE | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    echo "   Error: $ERROR"
    echo "   Message: $MESSAGE"
fi

echo ""
echo "====================================="
echo "🎯 테스트 완료!"
echo ""
echo "웹 UI에서 확인:"
echo "${BASE_URL}/dashboard/homework/teacher"
