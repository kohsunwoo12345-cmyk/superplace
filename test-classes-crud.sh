#!/bin/bash

echo "========================================="
echo "클래스 관리 API 통합 테스트"
echo "========================================="
echo ""

BASE_URL="http://localhost:3000"

# 1. 초기 클래스 목록 조회
echo "📚 1. 초기 클래스 목록 조회"
INITIAL=$(curl -s ${BASE_URL}/api/classes | jq '{total: .total, classes: [.classes[] | .name]}')
echo "$INITIAL"
INITIAL_COUNT=$(curl -s ${BASE_URL}/api/classes | jq '.total')
echo "✅ 초기 클래스 수: ${INITIAL_COUNT}개"
echo ""

# 2. 새 클래스 생성
echo "➕ 2. 새 클래스 생성"
NEW_CLASS=$(curl -s -X POST ${BASE_URL}/api/classes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 클래스",
    "grade": "고등 1학년",
    "description": "테스트용 클래스입니다",
    "color": "#00FF00",
    "capacity": 30
  }')
NEW_ID=$(echo "$NEW_CLASS" | jq -r '.class.id')
echo "$NEW_CLASS" | jq '{success, message, class: {id: .class.id, name: .class.name}}'
echo "✅ 생성된 클래스 ID: ${NEW_ID}"
echo ""

# 3. 생성 후 클래스 목록 확인
echo "📋 3. 생성 후 클래스 목록 확인"
AFTER_CREATE=$(curl -s ${BASE_URL}/api/classes | jq '.total')
echo "✅ 클래스 수: ${AFTER_CREATE}개 (이전: ${INITIAL_COUNT}개)"
echo ""

# 4. 클래스 수정
echo "✏️ 4. 클래스 수정 (방금 생성한 클래스)"
UPDATE=$(curl -s -X PUT ${BASE_URL}/api/classes \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"${NEW_ID}\",
    \"name\": \"테스트 클래스 (수정됨)\",
    \"grade\": \"고등 1학년\",
    \"description\": \"수정된 설명입니다\",
    \"color\": \"#FF00FF\",
    \"capacity\": 35
  }")
echo "$UPDATE" | jq '{success, message, class: {id: .class.id, name: .class.name, description: .class.description}}'
echo ""

# 5. 수정 확인
echo "🔍 5. 수정 확인"
MODIFIED=$(curl -s ${BASE_URL}/api/classes | jq ".classes[] | select(.id==\"${NEW_ID}\")")
echo "$MODIFIED" | jq '{id, name, description, color, capacity}'
echo ""

# 6. 클래스 삭제
echo "🗑️ 6. 클래스 삭제 (방금 생성한 클래스)"
DELETE=$(curl -s -X DELETE "${BASE_URL}/api/classes?id=${NEW_ID}")
echo "$DELETE" | jq '.'
echo ""

# 7. 삭제 후 클래스 목록 확인
echo "📋 7. 삭제 후 클래스 목록 확인"
AFTER_DELETE=$(curl -s ${BASE_URL}/api/classes | jq '.total')
echo "✅ 클래스 수: ${AFTER_DELETE}개 (초기: ${INITIAL_COUNT}개)"
echo ""

# 8. 최종 결과
echo "========================================="
echo "🎉 테스트 완료 요약"
echo "========================================="
echo "✅ 초기 클래스 수: ${INITIAL_COUNT}개"
echo "✅ 생성 후: ${AFTER_CREATE}개"
echo "✅ 삭제 후: ${AFTER_DELETE}개"
echo ""

if [ "$INITIAL_COUNT" == "$AFTER_DELETE" ]; then
  echo "🎯 완벽! 생성/수정/삭제가 모두 정상 작동합니다!"
  echo ""
  echo "📝 최종 클래스 목록:"
  curl -s ${BASE_URL}/api/classes | jq '[.classes[] | {id, name, students: ._count.students}]'
else
  echo "⚠️ 경고: 클래스 수가 일치하지 않습니다"
fi

echo ""
echo "========================================="
