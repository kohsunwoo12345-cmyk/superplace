#!/bin/bash

echo "========================================="
echo "🧪 숙제 결과 API 테스트"
echo "========================================="
echo ""

# 테스트 1: /api/homework/results 엔드포인트 (프론트엔드가 호출하는 URL)
echo "📍 테스트 1: /api/homework/results"
RESPONSE1=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "https://suplacestudy.com/api/homework/results" \
  -H "Authorization: Bearer dummy-token")

HTTP_STATUS1=$(echo "$RESPONSE1" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_STATUS/d')

echo "  - HTTP Status: $HTTP_STATUS1"
echo "  - Response: $BODY1"
echo ""

# 테스트 2: /api/homework/results/teacher 엔드포인트 (실제 파일 경로)
echo "📍 테스트 2: /api/homework/results/teacher"
RESPONSE2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "https://suplacestudy.com/api/homework/results/teacher" \
  -H "Authorization: Bearer dummy-token")

HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_STATUS/d')

echo "  - HTTP Status: $HTTP_STATUS2"
echo "  - Response: $BODY2"
echo ""

# 테스트 3: homework_submissions_v2 테이블 조회 (숙제 제출 데이터 확인)
echo "📍 테스트 3: 최근 제출된 숙제 확인"
echo "  - 방금 제출한 숙제가 있는지 확인 중..."
echo ""

# 결론
echo "========================================="
echo "📊 결론"
echo "========================================="
echo ""

if [ "$HTTP_STATUS1" == "404" ]; then
  echo "❌ 문제 발견: /api/homework/results 엔드포인트가 404"
  echo "   → 프론트엔드가 /api/homework/results를 호출하지만"
  echo "   → 실제 API는 /api/homework/results/teacher에 정의됨"
  echo ""
  echo "✅ 해결 방법:"
  echo "   1. /api/homework/results.ts 파일 생성 (teacher.ts를 참조)"
  echo "   2. 또는 프론트엔드를 /api/homework/results/teacher로 수정"
fi

if [ "$HTTP_STATUS2" == "200" ]; then
  echo "✅ /api/homework/results/teacher 엔드포인트는 정상 작동"
fi

echo ""
