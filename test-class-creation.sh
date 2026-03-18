#!/bin/bash

echo "=== 반 생성 테스트 ==="
echo ""

# 관리자 로그인 시뮬레이션
echo "1. 관리자 계정 확인"
ADMIN_EMAIL="admin@superplace.co.kr"
ADMIN_ID="1"
ACADEMY_ID="1"

# 토큰 생성 (간단한 형태)
TOKEN="${ADMIN_ID}|${ADMIN_EMAIL}|ADMIN|${ACADEMY_ID}"

echo "토큰: $TOKEN"

echo ""
echo "2. 반 생성 요청"
CLASS_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/classes/create-new" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"테스트반-$(date +%s)\",
    \"grade\": \"고1\",
    \"description\": \"테스트용 반\",
    \"color\": \"#3B82F6\",
    \"capacity\": 20
  }")

echo "$CLASS_RESPONSE" | python3 -m json.tool

SUCCESS=$(echo "$CLASS_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('success',False))" 2>/dev/null)
CLASS_ID=$(echo "$CLASS_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('classId',''))" 2>/dev/null)
ERROR=$(echo "$CLASS_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)

echo ""
if [ "$SUCCESS" = "True" ] && [ -n "$CLASS_ID" ]; then
  echo "✅ 반 생성 성공!"
  echo "   Class ID: $CLASS_ID"
else
  echo "❌ 반 생성 실패"
  if [ -n "$ERROR" ]; then
    echo "   오류: $ERROR"
  fi
fi

