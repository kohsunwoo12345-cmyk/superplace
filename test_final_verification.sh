#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🎯 최종 검증 테스트"
echo "====================================="
echo ""

# 배포 대기
echo "⏳ 배포 완료 대기 (90초)..."
sleep 90

echo "1️⃣ 숙제 조회 테스트 (teacherId=1, academyId 없음)"
RESPONSE1=$(curl -s "${BASE_URL}/api/homework/assignments/teacher?teacherId=1")
echo "$RESPONSE1" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE1"
echo ""

echo "2️⃣ 숙제 조회 테스트 (teacherId=1, academyId=1)"
RESPONSE2=$(curl -s "${BASE_URL}/api/homework/assignments/teacher?teacherId=1&academyId=1")
echo "$RESPONSE2" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE2"
echo ""

# 성공 여부 확인
SUCCESS1=$(echo $RESPONSE1 | grep -o '"success":true' | wc -l)
SUCCESS2=$(echo $RESPONSE2 | grep -o '"success":true' | wc -l)
COUNT1=$(echo $RESPONSE1 | grep -o '"id":"assignment-' | wc -l)
COUNT2=$(echo $RESPONSE2 | grep -o '"id":"assignment-' | wc -l)

echo "====================================="
echo "📊 결과:"
echo "   academyId 없음: $([ "$SUCCESS1" -gt "0" ] && echo '✅ 성공' || echo '❌ 실패') ($COUNT1개 숙제)"
echo "   academyId=1: $([ "$SUCCESS2" -gt "0" ] && echo '✅ 성공' || echo '❌ 실패') ($COUNT2개 숙제)"
echo ""

if [ "$SUCCESS1" -gt "0" ] && [ "$SUCCESS2" -gt "0" ]; then
    echo "🎉 모든 테스트 통과!"
    echo ""
    echo "이제 웹 UI에서 확인하세요:"
    echo "${BASE_URL}/dashboard/homework/teacher"
else
    echo "⚠️  일부 테스트 실패"
fi

echo "====================================="
