#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🧪 학원 이름 표시 최종 테스트"
echo "=============================="
echo ""

# 90초 대기
echo "⏳ 배포 대기 중 (90초)..."
sleep 90

echo ""
echo "1️⃣ 학생 통계 API 테스트 (userId=129, academyId=1.0)"
echo "==================================================="

RESPONSE=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=129&academyId=1.0")
echo "Response: $RESPONSE"

# 학원 이름 추출
ACADEMY_NAME=$(echo $RESPONSE | grep -o '"academyName":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "📊 결과:"
if [ -n "$ACADEMY_NAME" ] && [ "$ACADEMY_NAME" != "null" ]; then
  echo "  ✅ 학원 이름: '$ACADEMY_NAME' (성공!)"
else
  echo "  ❌ 학원 이름: null 또는 빈 값 (실패)"
fi

echo ""
echo "2️⃣ 다른 academyId 형식 테스트"
echo "================================"

# academyId=1 (정수)
RESPONSE2=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=129&academyId=1")
ACADEMY_NAME2=$(echo $RESPONSE2 | grep -o '"academyName":"[^"]*"' | cut -d'"' -f4)
echo "  academyId=1: '$ACADEMY_NAME2'"

# academyId=1.0 (소수)
RESPONSE3=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=129&academyId=1.0")
ACADEMY_NAME3=$(echo $RESPONSE3 | grep -o '"academyName":"[^"]*"' | cut -d'"' -f4)
echo "  academyId=1.0: '$ACADEMY_NAME3'"

echo ""
echo "✅ 테스트 완료!"
echo ""
echo "🌐 UI 확인:"
echo "   ${BASE_URL}/dashboard (학생 계정으로 로그인)"
echo ""
echo "📋 확인 사항:"
echo "   - 대시보드 상단에 학원 이름이 표시되는가?"
echo "   - 각 학생마다 소속 학원이 정확히 표시되는가?"

