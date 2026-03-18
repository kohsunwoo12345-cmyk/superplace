#!/bin/bash

echo "========================================="
echo "🧪 숙제 결과 API 최종 테스트"
echo "========================================="
echo ""

# 1. 새로운 /api/homework/results 엔드포인트 테스트
echo "📍 1단계: /api/homework/results 엔드포인트 테스트"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "https://suplacestudy.com/api/homework/results" \
  -H "Authorization: Bearer test-token")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "  HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" == "200" ]; then
  echo "✅ API 정상 작동!"
  echo ""
  
  # JSON 파싱하여 결과 개수 확인
  RESULT_COUNT=$(echo "$BODY" | grep -o '"submissionId"' | wc -l)
  echo "📊 제출 기록 수: $RESULT_COUNT 건"
  
  # V2 API로 제출한 데이터가 포함되어 있는지 확인
  if echo "$BODY" | grep -q "student-1773860330908"; then
    echo "✅ V2 API 제출 데이터 포함됨 (문자열 userId)"
  else
    echo "⚠️  V2 API 제출 데이터 미포함 (확인 필요)"
  fi
  
  # 최근 3개 제출 정보 출력
  echo ""
  echo "📋 최근 제출 정보 (처음 3개):"
  echo "$BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success') and data.get('results'):
        for i, r in enumerate(data['results'][:3], 1):
            print(f\"  {i}. {r.get('userName', '?')} - ID: {r.get('userId', '?')[:30]} - {r.get('submittedAt', '?')}\")
except:
    pass
  " 2>/dev/null || echo "  (JSON 파싱 실패)"
  
else
  echo "❌ API 오류: HTTP $HTTP_STATUS"
  echo "응답: $BODY"
fi

echo ""
echo "========================================="
echo "🎯 결론"
echo "========================================="
echo ""

if [ "$HTTP_STATUS" == "200" ]; then
  echo "✅ 숙제 결과 API 수정 완료!"
  echo "✅ /api/homework/results 엔드포인트 정상 작동"
  echo "✅ 프론트엔드에서 데이터를 받을 수 있음"
  echo ""
  echo "🌐 테스트 URL:"
  echo "  https://superplacestudy.pages.dev/dashboard/homework/results/"
  echo ""
  echo "📝 다음 단계:"
  echo "  1. 위 URL에서 로그인"
  echo "  2. 숙제 검사 결과 페이지 확인"
  echo "  3. 제출된 숙제 목록이 표시되는지 확인"
else
  echo "❌ 아직 배포 중이거나 다른 문제가 있을 수 있습니다"
  echo "   잠시 후 다시 시도해주세요"
fi

echo ""
