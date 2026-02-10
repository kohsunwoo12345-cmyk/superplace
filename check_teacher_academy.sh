#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🔍 Teacher academyId 확인"
echo "====================================="
echo ""

echo "숙제 목록에서 academyId 확인:"
RESPONSE=$(curl -s "${BASE_URL}/api/homework/assignments/teacher?teacherId=1")

# academyId 추출
ACADEMY_ID=$(echo $RESPONSE | grep -o '"academyId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Teacher의 academyId: '$ACADEMY_ID'"
echo ""

if [ -z "$ACADEMY_ID" ]; then
    echo "   ⚠️  academyId가 null입니다"
    echo "   이것이 academyId=1로 필터링 시 0개가 나오는 이유입니다"
else
    echo "   academyId가 '$ACADEMY_ID'로 저장되어 있습니다"
    echo "   academyId=$ACADEMY_ID로 필터링하면 숙제가 나올 것입니다"
fi

echo ""
echo "====================================="
