#!/bin/bash

echo "=== 주해성 학생 검색 ==="
echo ""

echo "⏳ 배포 대기 (180초)..."
sleep 180
echo ""

echo "🔍 '주해성' 검색..."
RESPONSE=$(curl -s "https://suplacestudy.com/api/admin/search-student?name=주해성")
echo "$RESPONSE" | jq '.'
echo ""

# Check if student found
COUNT=$(echo "$RESPONSE" | jq -r '.count // 0')
echo "검색 결과: $COUNT명"
echo ""

if [ "$COUNT" -gt 0 ]; then
  echo "📋 학생 상세 정보:"
  echo "$RESPONSE" | jq -r '.students[] | "  ID: \(.id)\n  이름: \(.name)\n  이메일: \(.email)\n  출석코드: \(.attendanceCode // "없음")\n  코드활성: \(.hasActiveCode)\n"'
  
  # Get student ID
  STUDENT_ID=$(echo "$RESPONSE" | jq -r '.students[0].id')
  
  echo ""
  echo "🔄 출석 코드 API로 직접 확인..."
  CODE_DIRECT=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$STUDENT_ID")
  echo "$CODE_DIRECT" | jq '.'
else
  echo "⚠️ 학생을 찾을 수 없습니다."
  echo ""
  echo "다른 이름으로 시도..."
  echo "🔍 '해성' 검색..."
  RESPONSE2=$(curl -s "https://suplacestudy.com/api/admin/search-student?name=해성")
  echo "$RESPONSE2" | jq '.'
fi
