#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🎯 학생 대시보드 최종 테스트"
echo "====================================="
echo ""
echo "⏳ 배포 완료 대기 (90초)..."
sleep 90

echo "테스트 시작!"
echo ""

RESPONSE=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=129&academyId=1")
echo "응답:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

SUCCESS=$(echo $RESPONSE | grep -o '"success":true' | wc -l)

if [ "$SUCCESS" -gt "0" ]; then
    echo "🎉 테스트 성공!"
    echo ""
    echo "웹 UI에서 확인: ${BASE_URL}/dashboard"
else
    echo "❌ 테스트 실패"
fi

echo "====================================="
