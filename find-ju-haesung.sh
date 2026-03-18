#!/bin/bash

echo "=== 주해성 학생 찾기 ==="
echo ""

# URL encode Korean name
NAME_ENCODED=$(printf "%s" "주해성" | jq -sRr @uri)
echo "🔍 검색: 주해성 (encoded: $NAME_ENCODED)"
echo ""

RESPONSE=$(curl -s "https://suplacestudy.com/api/admin/search-student?name=$NAME_ENCODED")
echo "$RESPONSE" | jq '.'
echo ""

COUNT=$(echo "$RESPONSE" | jq -r '.count')
echo "검색 결과: $COUNT명"
echo ""

if [ "$COUNT" -gt 0 ]; then
  STUDENT_ID=$(echo "$RESPONSE" | jq -r '.students[0].id')
  CODE=$(echo "$RESPONSE" | jq -r '.students[0].attendanceCode // "없음"')
  HAS_CODE=$(echo "$RESPONSE" | jq -r '.students[0].hasActiveCode')
  
  echo "✅ 학생 정보:"
  echo "  ID: $STUDENT_ID"
  echo "  이름: $(echo "$RESPONSE" | jq -r '.students[0].name')"
  echo "  이메일: $(echo "$RESPONSE" | jq -r '.students[0].email')"
  echo "  출석 코드: $CODE"
  echo "  활성 상태: $HAS_CODE"
  echo ""
  
  if [ "$HAS_CODE" = "false" ] || [ "$CODE" = "없음" ]; then
    echo "⚠️ 출석 코드가 없거나 비활성 상태입니다."
    echo ""
    echo "🔄 출석 코드 생성 시도..."
    
    # Try to get/generate code
    CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$STUDENT_ID")
    echo "$CODE_RESPONSE" | jq '.'
    
    NEW_CODE=$(echo "$CODE_RESPONSE" | jq -r '.code // "생성실패"')
    echo ""
    echo "생성된 코드: $NEW_CODE"
  fi
else
  echo "❌ '주해성' 학생을 찾을 수 없습니다."
  echo ""
  echo "📋 비슷한 이름으로 검색 시도..."
  
  for NAME in "해성" "주" "성"; do
    echo ""
    echo "  검색: $NAME"
    NAME_ENC=$(printf "%s" "$NAME" | jq -sRr @uri)
    ALT_RESPONSE=$(curl -s "https://suplacestudy.com/api/admin/search-student?name=$NAME_ENC")
    ALT_COUNT=$(echo "$ALT_RESPONSE" | jq -r '.count')
    echo "  결과: $ALT_COUNT명"
    
    if [ "$ALT_COUNT" -gt 0 ]; then
      echo "$ALT_RESPONSE" | jq -r '.students[] | "    - \(.name) (ID: \(.id))"'
    fi
  done
fi
