#!/bin/bash
# 간단한 구독 상태 테스트

BASE_URL="https://superplacestudy.pages.dev"

echo "🧪 구독 시스템 기본 테스트"
echo "============================"
echo ""

# 1. 요금제 목록 조회 (인증 없이)
echo "[1/3] 요금제 목록 조회..."
PLANS=$(curl -s "${BASE_URL}/api/admin/pricing-plans")
PLAN_COUNT=$(echo "$PLANS" | jq -r '.plans | length // 0')
echo "  요금제 수: $PLAN_COUNT"
if [ "$PLAN_COUNT" -gt 0 ]; then
  echo "  첫 번째 요금제: $(echo "$PLANS" | jq -r '.plans[0].name // "N/A"')"
  FIRST_PLAN=$(echo "$PLANS" | jq -r '.plans[0].id // empty')
  echo "  ID: $FIRST_PLAN"
fi
echo ""

# 2. 학원 목록 조회 (인증 필요 - 403 예상)
echo "[2/3] 학원 목록 조회 (인증 없이 - 401 예상)..."
ACADEMIES_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/admin/academies")
HTTP_CODE=$(echo "$ACADEMIES_RESPONSE" | tail -1)
BODY=$(echo "$ACADEMIES_RESPONSE" | head -n -1)
echo "  HTTP 상태: $HTTP_CODE"
if [ "$HTTP_CODE" == "401" ]; then
  echo "  ✅ 인증 필요 (정상)"
else
  echo "  ⚠️  예상과 다른 응답"
fi
echo ""

# 3. 구독 상태 API 엔드포인트 확인
echo "[3/3] 구독 상태 API 엔드포인트 확인..."
SUB_STATUS=$(curl -s "${BASE_URL}/api/subscriptions/status?userId=test")
echo "  응답: $(echo "$SUB_STATUS" | jq -c '.success, .message' | head -c 100)"
echo ""

echo "============================"
echo "✅ 기본 테스트 완료"
echo ""
echo "📝 참고:"
echo "  - 실제 테스트는 로그인 후 진행해야 합니다"
echo "  - test-complete-subscription-flow.sh 사용 권장"
echo ""
