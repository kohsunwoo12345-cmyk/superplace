#!/bin/bash

echo "========================================="
echo "클래스 전체 CRUD 통합 테스트"
echo "========================================="
echo ""

# 학원장 토큰
TOKEN="1|director@test.com|DIRECTOR|1|$(date +%s)"

echo "1️⃣ 초기 클래스 목록 조회"
INITIAL=$(curl -s -X GET "http://localhost:3001/api/classes" \
  -H "Authorization: Bearer $TOKEN")
INITIAL_COUNT=$(echo "$INITIAL" | jq -r '.total')
echo "총 $INITIAL_COUNT개 클래스"
echo ""

echo "2️⃣ 새 클래스 생성 (프론트엔드 방식)"
CREATE_RESULT=$(curl -s -X POST "http://localhost:3001/api/classes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "통합테스트 클래스",
    "grade": "초등 4학년",
    "description": "CRUD 테스트용 클래스",
    "color": "#FF6B6B",
    "capacity": 30,
    "isActive": true,
    "students": [],
    "schedules": [
      {
        "id": "1-1",
        "subject": "수학",
        "dayOfWeek": 1,
        "startTime": "14:00",
        "endTime": "15:00"
      }
    ]
  }')

NEW_ID=$(echo "$CREATE_RESULT" | jq -r '.class.id')
echo "✅ 생성된 클래스 ID: $NEW_ID"
echo ""

echo "3️⃣ 생성 후 클래스 목록 조회"
AFTER_CREATE=$(curl -s -X GET "http://localhost:3001/api/classes" \
  -H "Authorization: Bearer $TOKEN")
AFTER_CREATE_COUNT=$(echo "$AFTER_CREATE" | jq -r '.total')
echo "총 $AFTER_CREATE_COUNT개 클래스"

# 새 클래스가 목록에 있는지 확인
NEW_CLASS=$(echo "$AFTER_CREATE" | jq -r --arg id "$NEW_ID" '.classes[] | select(.id == $id) | .name')
if [ -n "$NEW_CLASS" ]; then
  echo "✅ 생성된 클래스가 목록에 표시됨: $NEW_CLASS"
else
  echo "❌ 생성된 클래스가 목록에 없음!"
fi
echo ""

echo "4️⃣ 클래스 수정"
UPDATE_RESULT=$(curl -s -X PUT "http://localhost:3001/api/classes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$NEW_ID\",
    \"name\": \"통합테스트 클래스 (수정됨)\",
    \"grade\": \"초등 4학년\",
    \"description\": \"수정된 설명\",
    \"color\": \"#4ECDC4\",
    \"capacity\": 30,
    \"isActive\": true,
    \"students\": [],
    \"schedules\": [
      {
        \"id\": \"1-1\",
        \"subject\": \"영어\",
        \"dayOfWeek\": 2,
        \"startTime\": \"15:00\",
        \"endTime\": \"16:00\"
      }
    ]
  }")

echo "✅ 클래스 수정 완료"
echo ""

echo "5️⃣ 수정 후 클래스 조회"
AFTER_UPDATE=$(curl -s -X GET "http://localhost:3001/api/classes" \
  -H "Authorization: Bearer $TOKEN")
UPDATED_CLASS=$(echo "$AFTER_UPDATE" | jq -r --arg id "$NEW_ID" '.classes[] | select(.id == $id) | {name, description, color}')
echo "수정된 클래스 정보:"
echo "$UPDATED_CLASS" | jq '.'
echo ""

echo "6️⃣ 클래스 삭제"
DELETE_RESULT=$(curl -s -X DELETE "http://localhost:3001/api/classes?id=$NEW_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "✅ 클래스 삭제 완료"
echo ""

echo "7️⃣ 삭제 후 클래스 목록 조회"
AFTER_DELETE=$(curl -s -X GET "http://localhost:3001/api/classes" \
  -H "Authorization: Bearer $TOKEN")
AFTER_DELETE_COUNT=$(echo "$AFTER_DELETE" | jq -r '.total')
echo "총 $AFTER_DELETE_COUNT개 클래스"

# 삭제된 클래스가 목록에 없는지 확인
DELETED_CHECK=$(echo "$AFTER_DELETE" | jq -r --arg id "$NEW_ID" '.classes[] | select(.id == $id) | .id')
if [ -z "$DELETED_CHECK" ]; then
  echo "✅ 삭제된 클래스가 목록에서 제거됨"
else
  echo "❌ 삭제된 클래스가 아직 목록에 있음!"
fi
echo ""

echo "========================================="
echo "검증 결과:"
echo "========================================="

if [ "$AFTER_CREATE_COUNT" -eq $((INITIAL_COUNT + 1)) ]; then
  echo "✅ 생성: 클래스 수가 1개 증가 ($INITIAL_COUNT → $AFTER_CREATE_COUNT)"
else
  echo "❌ 생성: 클래스 수 불일치 (예상: $((INITIAL_COUNT + 1)), 실제: $AFTER_CREATE_COUNT)"
fi

if echo "$UPDATED_CLASS" | jq -e '.name | contains("수정됨")' > /dev/null; then
  echo "✅ 수정: 클래스 이름 변경 확인"
else
  echo "❌ 수정: 클래스 이름 변경 실패"
fi

if [ "$AFTER_DELETE_COUNT" -eq "$INITIAL_COUNT" ]; then
  echo "✅ 삭제: 클래스 수가 원래대로 복구 ($AFTER_DELETE_COUNT)"
else
  echo "❌ 삭제: 클래스 수 불일치 (예상: $INITIAL_COUNT, 실제: $AFTER_DELETE_COUNT)"
fi

echo ""
echo "========================================="
echo "✅ 전체 CRUD 테스트 완료!"
echo "========================================="
