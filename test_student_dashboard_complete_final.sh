#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🎓 학생 대시보드 최종 통합 테스트"
echo "===================================="
echo ""

# 90초 대기
echo "⏳ 배포 대기 중 (90초)..."
sleep 90

echo ""
echo "1️⃣ 학생 통계 API 테스트 (userId=129)"
echo "======================================"

RESPONSE=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=129&academyId=1.0")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# 데이터 추출
SUCCESS=$(echo $RESPONSE | jq -r '.success' 2>/dev/null)
ATTENDANCE=$(echo $RESPONSE | jq -r '.attendanceDays' 2>/dev/null)
COMPLETED=$(echo $RESPONSE | jq -r '.completedHomework' 2>/dev/null)
SCORE=$(echo $RESPONSE | jq -r '.averageScore' 2>/dev/null)
HOURS=$(echo $RESPONSE | jq -r '.studyHours' 2>/dev/null)
ACADEMY=$(echo $RESPONSE | jq -r '.academyName' 2>/dev/null)
PENDING_COUNT=$(echo $RESPONSE | jq '.pendingHomework | length' 2>/dev/null)

echo ""
echo "📊 파싱된 데이터:"
echo "  - API 성공: $SUCCESS"
echo "  - 출석일: $ATTENDANCE일"
echo "  - 완료 과제: $COMPLETED개"
echo "  - 평균 점수: $SCORE점"
echo "  - 학습 시간: $HOURS시간"
echo "  - 학원 이름: $ACADEMY"
echo "  - 제출할 과제: $PENDING_COUNT개"

echo ""
echo "2️⃣ 다른 학생 테스트 (userId=130)"
echo "================================="

RESPONSE2=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=130&academyId=1.0")
ACADEMY2=$(echo $RESPONSE2 | jq -r '.academyName' 2>/dev/null)
PENDING_COUNT2=$(echo $RESPONSE2 | jq '.pendingHomework | length' 2>/dev/null)

echo "  - 학원 이름: $ACADEMY2"
echo "  - 제출할 과제: $PENDING_COUNT2개"

echo ""
echo "✅ 테스트 결과:"
if [ "$SUCCESS" = "true" ]; then
  echo "  ✅ API 호출 성공"
else
  echo "  ❌ API 호출 실패"
fi

if [ "$ACADEMY" != "null" ] && [ -n "$ACADEMY" ]; then
  echo "  ✅ 학원 이름 표시: '$ACADEMY'"
else
  echo "  ⚠️  학원 이름 미설정: '$ACADEMY'"
fi

if [ "$PENDING_COUNT" -gt 0 ]; then
  echo "  ✅ 제출할 과제 있음: $PENDING_COUNT개"
else
  echo "  ℹ️  제출할 과제 없음"
fi

echo ""
echo "🌐 UI 확인:"
echo "   ${BASE_URL}/dashboard"
echo ""
echo "📋 확인 사항:"
echo "   1) 출석일, 완료 과제, 평균 점수, 학습 시간이 표시되는가?"
echo "   2) 제출할 과제 목록이 표시되는가?"
echo "   3) 학원 이름이 표시되는가? (미설정인 경우 '소속 학원 미설정')"
echo "   4) 학생마다 다른 데이터가 표시되는가?"

