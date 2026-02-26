#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 요금제 시스템 마이그레이션 및 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_BASE="https://superplacestudy.pages.dev"

echo "⏳ 배포 대기 중 (2분)..."
sleep 120

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 0: DB 마이그레이션 실행"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MIGRATION_RESPONSE=$(curl -s "$API_BASE/api/admin/run-subscription-migration")
echo "$MIGRATION_RESPONSE" | jq '.'

SUCCESS=$(echo "$MIGRATION_RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo ""
  echo "✅ 마이그레이션 성공! 테스트를 시작합니다."
  echo ""
  sleep 3
  
  # 전체 플로우 테스트 실행
  ./test_subscription_flow.sh
else
  echo ""
  echo "❌ 마이그레이션 실패!"
  echo "$MIGRATION_RESPONSE" | jq '.details'
fi

