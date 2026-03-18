#!/bin/bash

echo "=== 전체 학생 출석 코드 검증 ==="
echo ""

SUCCESS=0
FAIL=0
NO_CODE=0

# Test students 1-100
for ID in {1..100}; do
  CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID")
  
  if echo "$CODE_RESPONSE" | grep -q '"code"'; then
    CODE=$(echo "$CODE_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$CODE" ]; then
      # Try to verify attendance
      VERIFY_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
        -H "Content-Type: application/json" \
        -d "{\"code\":\"$CODE\"}")
      
      if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
        echo "  학생 ID $ID: ✅ 코드 $CODE - 출석 성공"
        SUCCESS=$((SUCCESS + 1))
      else
        echo "  학생 ID $ID: ❌ 코드 $CODE - 출석 실패"
        FAIL=$((FAIL + 1))
      fi
    else
      NO_CODE=$((NO_CODE + 1))
    fi
  else
    NO_CODE=$((NO_CODE + 1))
  fi
  
  sleep 0.1
done

echo ""
echo "=== 최종 통계 ==="
echo "✅ 출석 성공: $SUCCESS"
echo "❌ 출석 실패: $FAIL"
echo "⚠️ 코드 없음: $NO_CODE"
echo "총 테스트: 100"
