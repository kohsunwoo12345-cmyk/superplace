#!/bin/bash

echo "========================================="
echo "구독 정보 조회 전체 테스트"
echo "========================================="
echo ""

# 테스트할 사용자 ID 목록
USER_IDS=(
  "test-user-1772098439"
  "user-1771479246368-du957iw33"
)

BASE_URL="https://superplacestudy.pages.dev"

echo "📡 배포 대기 중... (30초)"
sleep 30

for USER_ID in "${USER_IDS[@]}"; do
  echo ""
  echo "----------------------------------------"
  echo "테스트 사용자: $USER_ID"
  echo "----------------------------------------"
  
  # API 호출
  RESPONSE=$(curl -s "$BASE_URL/api/subscription/check?userId=$USER_ID")
  
  # 응답 출력
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
  
  # 성공 여부 확인
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)
  HAS_SUB=$(echo "$RESPONSE" | jq -r '.hasSubscription' 2>/dev/null)
  
  if [ "$SUCCESS" = "true" ] && [ "$HAS_SUB" = "true" ]; then
    PLAN_NAME=$(echo "$RESPONSE" | jq -r '.subscription.planName' 2>/dev/null)
    echo "✅ 성공: $PLAN_NAME 구독 발견"
  elif [ "$SUCCESS" = "true" ] && [ "$HAS_SUB" = "false" ]; then
    echo "⚠️  구독 없음 (정상 응답)"
  else
    echo "❌ 실패: API 에러"
  fi
done

echo ""
echo "========================================="
echo "테스트 완료"
echo "========================================="
