#!/bin/bash

echo "=== 전체 정리 및 통계 ==="
echo ""

echo "🧹 1단계: 고아 코드 최종 정리..."
CLEANUP=$(curl -s -X POST "https://suplacestudy.com/api/admin/cleanup-orphaned-codes")
echo "$CLEANUP" | jq '{success, message, stats}'
echo ""

DEACTIVATED=$(echo "$CLEANUP" | jq -r '.stats.deactivated // 0')
echo "비활성화됨: $DEACTIVATED개"
echo ""

echo "🔄 2단계: 코드 재생성..."
GENERATE=$(curl -s -X POST "https://suplacestudy.com/api/admin/generate-all-attendance-codes")
echo "$GENERATE" | jq '{success, message, stats}'
echo ""

echo "📊 3단계: 활성 코드 통계..."
ACTIVE_COUNT=0
INACTIVE_COUNT=0

for ID in {1..300}; do
  RESP=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID" 2>/dev/null)
  if echo "$RESP" | jq -e '.success == true' >/dev/null 2>&1; then
    IS_ACTIVE=$(echo "$RESP" | jq -r '.isActive // 0')
    if [ "$IS_ACTIVE" = "1" ]; then
      ACTIVE_COUNT=$((ACTIVE_COUNT + 1))
    else
      INACTIVE_COUNT=$((INACTIVE_COUNT + 1))
    fi
  fi
  
  if [ $((ID % 100)) -eq 0 ]; then
    echo "... $ID/300 확인 완료"
  fi
  
  sleep 0.02
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 최종 통계 (ID 1-300)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 활성 출석 코드: $ACTIVE_COUNT개"
echo "🔒 비활성 코드: $INACTIVE_COUNT개"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ACTIVE_COUNT -ge 291 ]; then
  echo "🎉 291명 이상의 학생이 활성 출석 코드를 보유하고 있습니다!"
else
  DIFF=$((291 - ACTIVE_COUNT))
  echo "⚠️ 예상보다 $DIFF명 부족합니다."
  echo ""
  echo "가능한 원인:"
  echo "  1. users 테이블에 실제로 118명의 STUDENT만 존재"
  echo "  2. 나머지는 다른 role이거나 탈퇴(withdrawn) 상태"
  echo "  3. 프론트엔드가 다른 필터로 291명을 표시"
fi
