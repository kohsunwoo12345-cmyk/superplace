#!/bin/bash

echo "=== 최종 고아 코드 정리 및 검증 ==="
echo ""

echo "⏳ 배포 대기 (180초)..."
sleep 180
echo ""

echo "🧹 고아 코드 비활성화 실행..."
CLEANUP_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/admin/cleanup-orphaned-codes" \
  -H "Content-Type: application/json")
echo "$CLEANUP_RESPONSE" | jq '.' 2>/dev/null || echo "$CLEANUP_RESPONSE"
echo ""

# Extract stats
DEACTIVATED=$(echo "$CLEANUP_RESPONSE" | jq -r '.stats.deactivated // 0' 2>/dev/null)
echo "비활성화된 고아 코드: $DEACTIVATED개"
echo ""

echo "⏳ 정리 후 잠시 대기..."
sleep 5
echo ""

echo "🧪 최종 테스트: 모든 학생 (ID 1-50)"
SUCCESS=0
FAIL=0
NO_CODE=0
INACTIVE=0

for ID in {1..50}; do
  CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID")
  
  if echo "$CODE_RESPONSE" | grep -q '"code"'; then
    IS_ACTIVE=$(echo "$CODE_RESPONSE" | jq -r '.isActive // 0' 2>/dev/null)
    
    if [ "$IS_ACTIVE" = "1" ] || [ "$IS_ACTIVE" = "true" ]; then
      CODE=$(echo "$CODE_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
      
      VERIFY_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
        -H "Content-Type: application/json" \
        -d "{\"code\":\"$CODE\"}")
      
      if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
        SUCCESS=$((SUCCESS + 1))
      else
        echo "  학생 ID $ID: ❌ 코드 $CODE - 출석 실패"
        FAIL=$((FAIL + 1))
      fi
    else
      INACTIVE=$((INACTIVE + 1))
    fi
  else
    NO_CODE=$((NO_CODE + 1))
  fi
  
  sleep 0.05
done

echo ""
echo "=== 최종 결과 ==="
echo "✅ 출석 성공: $SUCCESS"
echo "❌ 출석 실패: $FAIL"
echo "🔒 비활성 코드: $INACTIVE"
echo "⚠️ 코드 없음: $NO_CODE"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 모든 활성 코드 정상 작동!"
  echo ""
  echo "📊 요약:"
  echo "  - 실제 학생 (활성 코드): $SUCCESS명"
  echo "  - 삭제된 학생 (비활성): $INACTIVE명"
  echo "  - 코드 미생성: $NO_CODE명"
else
  echo "⚠️ $FAIL개의 실패가 여전히 존재합니다"
fi
