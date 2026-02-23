#!/bin/bash

echo "========================================="
echo "학원장 클래스 생성 테스트"
echo "========================================="

# 학원장 토큰
TOKEN_DIRECTOR="1|director@test.com|DIRECTOR|1|$(date +%s)"

echo "1️⃣ 학원장이 새 클래스 생성 (teacherId 없음)"
CREATE_RESULT=$(curl -s -X POST "http://localhost:3001/api/classes" \
  -H "Authorization: Bearer $TOKEN_DIRECTOR" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "학원장 생성 테스트반",
    "grade": "초등 3학년",
    "description": "선생님 미배정 클래스",
    "color": "#FF5733",
    "capacity": 20,
    "isActive": true,
    "students": [],
    "schedules": []
  }')

NEW_ID=$(echo "$CREATE_RESULT" | jq -r '.class.id')
echo "✅ 생성된 클래스 ID: $NEW_ID"
echo ""

echo "2️⃣ 학원장이 클래스 목록 조회"
DIRECTOR_CLASSES=$(curl -s -X GET "http://localhost:3001/api/classes" \
  -H "Authorization: Bearer $TOKEN_DIRECTOR")

TOTAL=$(echo "$DIRECTOR_CLASSES" | jq -r '.total')
echo "총 $TOTAL개 클래스 조회됨"
echo "$DIRECTOR_CLASSES" | jq -r '.classes[] | "   - [\(.id)] \(.name) (teacherId: \(.teacherId // "미배정"))"'
echo ""

# 새로 생성한 클래스가 있는지 확인
HAS_NEW=$(echo "$DIRECTOR_CLASSES" | jq -r --arg id "$NEW_ID" '.classes[] | select(.id == $id) | .name')
if [ -n "$HAS_NEW" ]; then
  echo "✅ 생성한 클래스가 목록에 표시됨: $HAS_NEW"
else
  echo "❌ 생성한 클래스가 목록에 없음!"
fi

echo ""
echo "3️⃣ 선생님(teacher@test.com)이 클래스 목록 조회"
TOKEN_TEACHER="2|teacher@test.com|TEACHER|1|$(date +%s)"
TEACHER_CLASSES=$(curl -s -X GET "http://localhost:3001/api/classes" \
  -H "Authorization: Bearer $TOKEN_TEACHER")

TEACHER_TOTAL=$(echo "$TEACHER_CLASSES" | jq -r '.total')
echo "총 $TEACHER_TOTAL개 클래스 조회됨"
echo "$TEACHER_CLASSES" | jq -r '.classes[] | "   - [\(.id)] \(.name) (teacherId: \(.teacherId // "미배정"))"'

# 새로 생성한 클래스가 선생님에게 보이지 않아야 함
TEACHER_HAS_NEW=$(echo "$TEACHER_CLASSES" | jq -r --arg id "$NEW_ID" '.classes[] | select(.id == $id) | .name')
if [ -z "$TEACHER_HAS_NEW" ]; then
  echo "✅ teacherId 미배정 클래스는 선생님에게 안 보임 (정상)"
else
  echo "❌ teacherId 미배정 클래스가 선생님에게 보임 (문제!)"
fi

echo ""
echo "========================================="
echo "✅ 테스트 완료!"
echo "========================================="
