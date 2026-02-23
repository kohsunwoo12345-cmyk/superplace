#!/bin/bash

echo "========================================="
echo "학원별 클래스 데이터 분리 테스트"
echo "========================================="
echo ""

# 학원장 A의 토큰 (academyId=1)
TOKEN_A="1|director@test.com|DIRECTOR|1|$(date +%s)"
echo "✅ 학원장 A 토큰: $TOKEN_A"
echo ""

# 학원장 B의 토큰 (academyId=2)
TOKEN_B="2|directorb@test.com|DIRECTOR|2|$(date +%s)"
echo "✅ 학원장 B 토큰: $TOKEN_B"
echo ""

# 학원장 A로 클래스 조회
echo "1️⃣ 학원장 A의 클래스 조회:"
CLASSES_A=$(curl -s -X GET "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json")
echo "$CLASSES_A" | jq -r '.classes[] | "   - [\(.id)] \(.name) (학생 \(._count.students)명)"'
COUNT_A=$(echo "$CLASSES_A" | jq -r '.total')
echo "   총 $COUNT_A개 클래스"
echo ""

# 학원장 B로 클래스 조회
echo "2️⃣ 학원장 B의 클래스 조회:"
CLASSES_B=$(curl -s -X GET "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json")
echo "$CLASSES_B" | jq -r '.classes[] | "   - [\(.id)] \(.name) (학생 \(._count.students)명)"'
COUNT_B=$(echo "$CLASSES_B" | jq -r '.total')
echo "   총 $COUNT_B개 클래스"
echo ""

# 학원장 A로 새 클래스 생성
echo "3️⃣ 학원장 A가 새 클래스 생성:"
NEW_CLASS_A=$(curl -s -X POST "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "학원A 전용 클래스",
    "grade": "초등 3학년",
    "description": "학원 A 전용",
    "color": "#FF0000",
    "capacity": 20,
    "isActive": true,
    "students": [],
    "schedules": [{"id":"1-1","subject":"수학","dayOfWeek":1,"startTime":"15:00","endTime":"16:00"}]
  }')
NEW_ID_A=$(echo "$NEW_CLASS_A" | jq -r '.class.id')
echo "   ✅ 생성된 클래스 ID: $NEW_ID_A"
echo ""

# 학원장 B로 새 클래스 생성
echo "4️⃣ 학원장 B가 새 클래스 생성:"
NEW_CLASS_B=$(curl -s -X POST "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "학원B 전용 클래스",
    "grade": "초등 4학년",
    "description": "학원 B 전용",
    "color": "#0000FF",
    "capacity": 25,
    "isActive": true,
    "students": [],
    "schedules": [{"id":"1-1","subject":"영어","dayOfWeek":2,"startTime":"16:00","endTime":"17:00"}]
  }')
NEW_ID_B=$(echo "$NEW_CLASS_B" | jq -r '.class.id')
echo "   ✅ 생성된 클래스 ID: $NEW_ID_B"
echo ""

# 다시 조회하여 분리 확인
echo "5️⃣ 생성 후 학원장 A의 클래스 목록 (학원B 클래스가 보이면 안됨):"
CLASSES_A_AFTER=$(curl -s -X GET "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json")
echo "$CLASSES_A_AFTER" | jq -r '.classes[] | "   - [\(.id)] \(.name) (학생 \(._count.students)명)"'
COUNT_A_AFTER=$(echo "$CLASSES_A_AFTER" | jq -r '.total')
echo "   총 $COUNT_A_AFTER개 클래스"
echo ""

echo "6️⃣ 생성 후 학원장 B의 클래스 목록 (학원A 클래스가 보이면 안됨):"
CLASSES_B_AFTER=$(curl -s -X GET "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json")
echo "$CLASSES_B_AFTER" | jq -r '.classes[] | "   - [\(.id)] \(.name) (학생 \(._count.students)명)"'
COUNT_B_AFTER=$(echo "$CLASSES_B_AFTER" | jq -r '.total')
echo "   총 $COUNT_B_AFTER개 클래스"
echo ""

# 검증
echo "========================================="
echo "검증 결과:"
echo "========================================="

# 학원 A에 학원B 전용 클래스가 있는지 확인
HAS_B_IN_A=$(echo "$CLASSES_A_AFTER" | jq -r '.classes[] | select(.name == "학원B 전용 클래스") | .id')
if [ -z "$HAS_B_IN_A" ]; then
  echo "✅ 학원 A에서 학원 B의 클래스가 보이지 않음 (정상)"
else
  echo "❌ 학원 A에서 학원 B의 클래스가 보임 (문제!)"
fi

# 학원 B에 학원A 전용 클래스가 있는지 확인
HAS_A_IN_B=$(echo "$CLASSES_B_AFTER" | jq -r '.classes[] | select(.name == "학원A 전용 클래스") | .id')
if [ -z "$HAS_A_IN_B" ]; then
  echo "✅ 학원 B에서 학원 A의 클래스가 보이지 않음 (정상)"
else
  echo "❌ 학원 B에서 학원 A의 클래스가 보임 (문제!)"
fi

# 학원 A에 학원A 전용 클래스가 있는지 확인
HAS_A_IN_A=$(echo "$CLASSES_A_AFTER" | jq -r '.classes[] | select(.name == "학원A 전용 클래스") | .id')
if [ -n "$HAS_A_IN_A" ]; then
  echo "✅ 학원 A에서 자신의 클래스가 보임 (정상)"
else
  echo "❌ 학원 A에서 자신의 클래스가 안 보임 (문제!)"
fi

# 학원 B에 학원B 전용 클래스가 있는지 확인
HAS_B_IN_B=$(echo "$CLASSES_B_AFTER" | jq -r '.classes[] | select(.name == "학원B 전용 클래스") | .id')
if [ -n "$HAS_B_IN_B" ]; then
  echo "✅ 학원 B에서 자신의 클래스가 보임 (정상)"
else
  echo "❌ 학원 B에서 자신의 클래스가 안 보임 (문제!)"
fi

echo ""
echo "========================================="
echo "✅ 학원별 데이터 분리 테스트 완료!"
echo "========================================="
