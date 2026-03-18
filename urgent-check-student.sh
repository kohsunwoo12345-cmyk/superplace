#!/bin/bash

echo "=== 긴급: 해당 학생 출석 코드 확인 ==="
echo ""

STUDENT_ID="student-1772865608071-3s67r1wq6n5"
EMAIL="student_1772865608071@temp.superplace.local"

echo "학생 ID: $STUDENT_ID"
echo "이메일: $EMAIL"
echo ""

echo "1. 이메일로 학생 검색..."
SEARCH=$(curl -s "https://suplacestudy.com/api/admin/search-student?name=1772865608071")
echo "$SEARCH" | jq '.'
echo ""

# Get userId from search
USER_ID=$(echo "$SEARCH" | jq -r '.students[0].id // empty')

if [ -z "$USER_ID" ]; then
  echo "❌ 학생을 찾을 수 없습니다!"
  echo "해당 student_id로 DB에 존재하지 않습니다."
  exit 1
fi

echo "✅ 찾은 userId: $USER_ID"
echo ""

echo "2. 출석 코드 조회..."
CODE_RESP=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$USER_ID")
echo "$CODE_RESP" | jq '.'
echo ""

CODE=$(echo "$CODE_RESP" | jq -r '.code // empty')
IS_ACTIVE=$(echo "$CODE_RESP" | jq -r '.isActive // 0')

if [ -z "$CODE" ]; then
  echo "❌ 출석 코드가 없습니다!"
  echo "코드 생성 필요..."
else
  echo "✅ 출석 코드: $CODE"
  echo "활성 상태: $IS_ACTIVE"
  echo ""
  
  if [ "$IS_ACTIVE" = "1" ]; then
    echo "3. 출석 인증 테스트..."
    VERIFY=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
      -H "Content-Type: application/json" \
      -d "{\"code\":\"$CODE\"}")
    echo "$VERIFY" | jq '.'
    
    if echo "$VERIFY" | grep -q '"success":true'; then
      echo ""
      echo "🎉 출석 코드 정상 작동!"
      echo "코드: $CODE"
    else
      echo ""
      echo "❌ 출석 인증 실패"
    fi
  else
    echo "⚠️ 코드가 비활성 상태입니다"
  fi
fi
