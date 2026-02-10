#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🧪 학생 대시보드 최종 테스트"
echo "================================"
echo ""

# 90초 대기
echo "⏳ 배포 대기 중 (90초)..."
sleep 90

echo ""
echo "1️⃣ 학생 통계 API 테스트 (userId=129, academyId=1)"
echo "================================================"

RESPONSE=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=129&academyId=1")
echo "Response: $RESPONSE"

# 응답 파싱
SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,}]*' | cut -d':' -f2)
ATTENDANCE_DAYS=$(echo $RESPONSE | grep -o '"attendanceDays":[^,}]*' | cut -d':' -f2)
COMPLETED_HOMEWORK=$(echo $RESPONSE | grep -o '"completedHomework":[^,}]*' | cut -d':' -f2)
AVERAGE_SCORE=$(echo $RESPONSE | grep -o '"averageScore":[^,}]*' | cut -d':' -f2)
STUDY_HOURS=$(echo $RESPONSE | grep -o '"studyHours":[^,}]*' | cut -d':' -f2)
ACADEMY_NAME=$(echo $RESPONSE | grep -o '"academyName":"[^"]*"' | cut -d'"' -f4)
PENDING_COUNT=$(echo $RESPONSE | grep -o '"id":"assignment-' | wc -l)

echo ""
echo "📊 파싱된 데이터:"
echo "  - API 성공: $SUCCESS"
echo "  - 출석일: $ATTENDANCE_DAYS일"
echo "  - 완료 과제: $COMPLETED_HOMEWORK개"
echo "  - 평균 점수: $AVERAGE_SCORE점"
echo "  - 학습 시간: $STUDY_HOURS시간"
echo "  - 학원 이름: $ACADEMY_NAME"
echo "  - 제출할 과제: $PENDING_COUNT개"

echo ""
echo "2️⃣ 다른 학생 테스트 (userId=130, academyId=1)"
echo "================================================"

RESPONSE2=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=130&academyId=1")
echo "Response: $RESPONSE2"

SUCCESS2=$(echo $RESPONSE2 | grep -o '"success":[^,}]*' | cut -d':' -f2)
ACADEMY_NAME2=$(echo $RESPONSE2 | grep -o '"academyName":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "📊 파싱된 데이터:"
echo "  - API 성공: $SUCCESS2"
echo "  - 학원 이름: $ACADEMY_NAME2"

echo ""
echo "✅ 테스트 완료!"
echo ""
echo "🌐 UI 확인:"
echo "   학생1 대시보드: ${BASE_URL}/dashboard (userId=129로 로그인)"
echo "   학생2 대시보드: ${BASE_URL}/dashboard (userId=130로 로그인)"
echo ""
echo "🔍 확인 사항:"
echo "   - 출석일, 완료 과제, 평균 점수, 학습 시간이 표시되는가?"
echo "   - 제출할 과제 목록이 표시되는가?"
echo "   - 학원 이름이 정확히 표시되는가?"
echo "   - 학생마다 다른 데이터가 표시되는가?"

