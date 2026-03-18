#!/bin/bash

echo "=== 291명 학생 출석 코드 전체 확인 ==="
echo ""

SUCCESS=0
NO_CODE=0
INACTIVE=0
FAIL=0

echo "🔍 학생 ID 1-300 범위 확인 중..."
echo ""

for ID in {1..300}; do
  CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID")
  
  if echo "$CODE_RESPONSE" | grep -q '"success":true'; then
    CODE=$(echo "$CODE_RESPONSE" | jq -r '.code // "없음"')
    IS_ACTIVE=$(echo "$CODE_RESPONSE" | jq -r '.isActive // 0')
    
    if [ "$IS_ACTIVE" = "1" ]; then
      SUCCESS=$((SUCCESS + 1))
      if [ $SUCCESS -le 10 ]; then
        echo "✅ ID $ID: 코드 $CODE (활성)"
      fi
    elif [ "$IS_ACTIVE" = "0" ]; then
      INACTIVE=$((INACTIVE + 1))
      if [ $INACTIVE -le 5 ]; then
        echo "🔒 ID $ID: 코드 $CODE (비활성)"
      fi
    fi
  else
    NO_CODE=$((NO_CODE + 1))
  fi
  
  # Progress indicator every 50 students
  if [ $((ID % 50)) -eq 0 ]; then
    echo "... 진행 중: $ID/300 확인됨"
  fi
  
  sleep 0.03
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 전체 통계 (ID 1-300 범위)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 활성 출석 코드: $SUCCESS개"
echo "🔒 비활성 코드: $INACTIVE개"
echo "❌ 코드 없음: $NO_CODE개"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL_WITH_CODE=$((SUCCESS + INACTIVE))
echo "총 출석 코드 보유: $TOTAL_WITH_CODE개"
echo "예상 학생 수: 291명"
echo ""

if [ $SUCCESS -ge 291 ]; then
  echo "🎉 모든 학생이 활성 출석 코드를 보유하고 있습니다!"
elif [ $TOTAL_WITH_CODE -ge 291 ]; then
  echo "⚠️ $INACTIVE개의 비활성 코드가 있습니다."
  echo "   cleanup API를 실행하여 정리 필요"
else
  MISSING=$((291 - TOTAL_WITH_CODE))
  echo "⚠️ $MISSING명의 학생에게 출석 코드가 없습니다."
  echo "   일괄 생성 API 실행 필요"
fi

