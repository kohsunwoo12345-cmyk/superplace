#!/bin/bash

echo "=== 최종 정리 및 확인 ==="
echo ""

echo "🧹 고아 코드 재정리..."
CLEANUP=$(curl -s -X POST "https://suplacestudy.com/api/admin/cleanup-orphaned-codes")
echo "$CLEANUP" | jq '{success, message, stats}'
echo ""

CLEANED=$(echo "$CLEANUP" | jq -r '.stats.deactivated // 0')
echo "추가 정리: $CLEANED개"
echo ""

if [ "$CLEANED" -gt 0 ]; then
  echo "🧪 ID 50 재확인..."
  CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=50")
  IS_ACTIVE=$(echo "$CODE_RESPONSE" | jq -r '.isActive // 0')
  
  if [ "$IS_ACTIVE" = "0" ] || [ "$IS_ACTIVE" = "false" ]; then
    echo "✅ ID 50 비활성화됨"
  else
    echo "⚠️ ID 50 여전히 활성 상태"
  fi
fi

echo ""
echo "📊 전체 활성 학생 수 확인..."
ACTIVE=0
for ID in {1..100}; do
  CODE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID")
  if echo "$CODE" | jq -e '.isActive == 1' >/dev/null 2>&1; then
    ACTIVE=$((ACTIVE + 1))
  fi
  sleep 0.02
done

echo "활성 출석 코드: $ACTIVE개"
echo ""
echo "✅ 정리 완료!"
