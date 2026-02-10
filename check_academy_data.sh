#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🔍 학원 데이터 확인"
echo "==================="
echo ""

echo "1️⃣ 학생 정보 확인 (userId=129)"
STUDENT_RESPONSE=$(curl -s "${BASE_URL}/api/students?academyId=1&role=TEACHER&userId=1" | grep -o '"id":129[^}]*}')
echo "학생 129 정보: $STUDENT_RESPONSE"

# academyId 추출
ACADEMY_ID=$(echo "$STUDENT_RESPONSE" | grep -o '"academyId":"[^"]*"' | cut -d'"' -f4)
if [ -z "$ACADEMY_ID" ]; then
  ACADEMY_ID=$(echo "$STUDENT_RESPONSE" | grep -o '"academyId":[^,}]*' | cut -d':' -f2)
fi

echo "  → academyId: '$ACADEMY_ID'"
echo ""

echo "2️⃣ DB에 저장된 academy 테이블 확인이 필요합니다"
echo "   academyId가 '$ACADEMY_ID'로 저장되어 있는 경우"
echo "   academy.id가 동일한 형식인지 확인 필요"
echo ""

echo "🔧 해결 방법:"
echo "   1) academy.id를 문자열로 비교"
echo "   2) 또는 academyId를 정수로 변환하여 비교"

