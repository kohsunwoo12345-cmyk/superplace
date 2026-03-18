#!/bin/bash

echo "=== 모든 학생 출석 코드 생성 및 검증 ==="
echo ""

echo "🔄 1단계: 출석 코드 일괄 생성..."
GENERATE_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/admin/generate-all-attendance-codes")
echo "$GENERATE_RESPONSE" | jq '.'
echo ""

TOTAL_STUDENTS=$(echo "$GENERATE_RESPONSE" | jq -r '.stats.totalStudents // 0')
CREATED=$(echo "$GENERATE_RESPONSE" | jq -r '.stats.created // 0')
echo "📊 총 학생 수: $TOTAL_STUDENTS"
echo "✅ 새로 생성된 코드: $CREATED개"
echo ""

echo "🧹 2단계: 고아 코드 정리..."
CLEANUP_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/admin/cleanup-orphaned-codes")
DEACTIVATED=$(echo "$CLEANUP_RESPONSE" | jq -r '.stats.deactivated // 0')
echo "🔒 비활성화된 코드: $DEACTIVATED개"
echo ""

echo "🧪 3단계: 샘플 검증 (20명)..."
SUCCESS=0
FAIL=0
for ID in 1 2 3 10 23 50 100 150 200 250 270 271 272 273 274 275 276 277 280 290; do
  CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID")
  
  if echo "$CODE_RESPONSE" | jq -e '.success == true and .isActive == 1' >/dev/null 2>&1; then
    CODE=$(echo "$CODE_RESPONSE" | jq -r '.code')
    
    # Verify attendance works
    VERIFY=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
      -H "Content-Type: application/json" \
      -d "{\"code\":\"$CODE\"}")
    
    if echo "$VERIFY" | grep -q '"success":true'; then
      echo "  ✅ ID $ID: 코드 $CODE - 출석 성공"
      SUCCESS=$((SUCCESS + 1))
    else
      echo "  ❌ ID $ID: 코드 $CODE - 출석 실패"
      FAIL=$((FAIL + 1))
    fi
  fi
  sleep 0.1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 최종 결과"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "총 학생 수: $TOTAL_STUDENTS명"
echo "새로 생성: $CREATED개"
echo "비활성화: $DEACTIVATED개"
echo "샘플 검증: $SUCCESS/$((SUCCESS + FAIL)) 성공"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 모든 샘플 학생의 출석 코드가 정상 작동합니다!"
else
  echo "⚠️ $FAIL개의 실패가 있습니다."
fi
