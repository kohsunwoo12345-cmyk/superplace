#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🧪 숙제 페이지 수정사항 검증"
echo "====================================="
echo ""

# 배포 대기
echo "⏳ 배포 완료 대기 (90초)..."
sleep 90

echo "1️⃣ 학생 API 테스트"
echo ""

# 기존 방식 (academyId만)
echo "📍 기존 방식 (academyId만):"
RESPONSE_OLD=$(curl -s "${BASE_URL}/api/students?academyId=1")
COUNT_OLD=$(echo $RESPONSE_OLD | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "   학생 수: $COUNT_OLD"
echo ""

# 새로운 방식 (role + userId + academyId)
echo "📍 새로운 방식 (role + userId + academyId):"
RESPONSE_NEW=$(curl -s "${BASE_URL}/api/students?academyId=1&role=TEACHER&userId=1")
COUNT_NEW=$(echo $RESPONSE_NEW | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "   학생 수: $COUNT_NEW"
echo ""

echo "====================================="
echo "📊 결과 요약:"
echo ""
echo "✅ 기존 방식: $COUNT_OLD명 (예상: 0명)"
echo "✅ 새로운 방식: $COUNT_NEW명 (예상: 4명 이상)"
echo ""

if [ "$COUNT_NEW" -gt "0" ]; then
    echo "🎉 성공! 학생 목록이 정상적으로 조회됩니다!"
    echo ""
    echo "이제 다음을 테스트하세요:"
    echo "1. ${BASE_URL}/dashboard/homework/teacher 접속"
    echo "2. '새 숙제 만들기' 클릭"
    echo "3. '특정 학생' 선택"
    echo "4. 학생 목록 확인 ✅"
else
    echo "⚠️ 아직 학생이 없거나 배포 대기 중입니다."
    echo "잠시 후 다시 시도해주세요."
fi
