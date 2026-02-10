#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🎯 학생 숙제 최종 검증"
echo "====================================="
echo ""

# 배포 대기
echo "⏳ 배포 완료 대기 (90초)..."
sleep 90

echo "====================================="
echo "테스트 시작!"
echo "====================================="
echo ""

# 1. 학생 숙제 조회
echo "1️⃣ 학생 129번 숙제 조회"
RESPONSE=$(curl -s "${BASE_URL}/api/homework/assignments/student?studentId=129")
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# 숙제 수 확인
ALL_COUNT=$(echo $RESPONSE | grep -o '"id":"assignment-' | wc -l)
TODAY_COUNT=$(echo $RESPONSE | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('summary', {}).get('todayCount', 0))" 2>/dev/null)
UPCOMING_COUNT=$(echo $RESPONSE | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('summary', {}).get('upcomingCount', 0))" 2>/dev/null)

echo "   전체 숙제: $ALL_COUNT개"
echo "   오늘 마감: $TODAY_COUNT개"
echo "   다가오는 숙제: $UPCOMING_COUNT개"
echo ""

# 2. 선생님 숙제 확인
echo "2️⃣ 선생님이 생성한 숙제 확인"
TEACHER_RESPONSE=$(curl -s "${BASE_URL}/api/homework/assignments/teacher?teacherId=1")
TEACHER_COUNT=$(echo $TEACHER_RESPONSE | grep -o '"id":"assignment-' | wc -l)
echo "   선생님 숙제: $TEACHER_COUNT개"
echo ""

echo "====================================="
echo "📊 최종 결과:"
echo "   선생님이 생성한 숙제: $TEACHER_COUNT개"
echo "   학생이 볼 수 있는 숙제: $ALL_COUNT개"
echo ""

if [ "$ALL_COUNT" -gt "0" ]; then
    echo "🎉 성공! 학생이 숙제를 볼 수 있습니다!"
    echo ""
    echo "이제 웹 UI에서 확인하세요:"
    echo "${BASE_URL}/dashboard (학생 계정으로 로그인)"
else
    echo "⚠️  아직 학생이 숙제를 볼 수 없습니다."
    echo ""
    echo "가능한 원인:"
    echo "1. 배포가 아직 완료되지 않음 (잠시 후 재시도)"
    echo "2. dueDate가 과거 날짜 (2026-02-15인지 확인)"
fi

echo "====================================="
