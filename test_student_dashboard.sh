#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🧪 학생 대시보드 통계 테스트"
echo "====================================="
echo ""

# 배포 대기
echo "⏳ 배포 완료 대기 (90초)..."
sleep 90

echo "====================================="
echo "테스트 시작!"
echo "====================================="
echo ""

# 1. 학생 통계 조회 (userId=129, academyId=1)
echo "1️⃣ 학생 통계 조회 (학생 ID: 129, 학원 ID: 1)"
RESPONSE=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=129&academyId=1")
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# 2. 통계 필드 확인
SUCCESS=$(echo $RESPONSE | grep -o '"success":true' | wc -l)
ATTENDANCE=$(echo $RESPONSE | grep -o '"attendanceDays":[0-9]*' | cut -d':' -f2)
HOMEWORK=$(echo $RESPONSE | grep -o '"completedHomework":[0-9]*' | cut -d':' -f2)
SCORE=$(echo $RESPONSE | grep -o '"averageScore":[0-9]*' | cut -d':' -f2)
HOURS=$(echo $RESPONSE | grep -o '"studyHours":[0-9]*' | cut -d':' -f2)
ACADEMY=$(echo $RESPONSE | grep -o '"academyName":"[^"]*"' | cut -d'"' -f4)

echo "====================================="
echo "📊 통계 요약:"
echo "====================================="
echo ""
echo "✅ API 호출 성공: $([ "$SUCCESS" -gt "0" ] && echo 'YES' || echo 'NO')"
echo "📅 출석일: ${ATTENDANCE}일"
echo "✅ 완료 과제: ${HOMEWORK}개"
echo "📝 평균 점수: ${SCORE}점"
echo "⏰ 학습 시간: ${HOURS}시간"
echo "🏫 소속 학원: ${ACADEMY:-'(없음)'}"
echo ""

if [ "$SUCCESS" -gt "0" ]; then
    echo "🎉 테스트 통과! 학생 통계 API가 정상 작동합니다."
    echo ""
    echo "웹 UI에서 확인:"
    echo "${BASE_URL}/dashboard"
else
    echo "⚠️  테스트 실패 - API 에러 확인 필요"
fi

echo ""
echo "====================================="
