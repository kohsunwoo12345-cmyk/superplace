#!/bin/bash

echo "=== 고아 출석 코드 정리 및 재테스트 ==="
echo ""

echo "⏳ 배포 대기 (180초)..."
sleep 180
echo ""

echo "🧹 고아 코드 정리 실행..."
CLEANUP_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/admin/cleanup-orphaned-codes")
echo "$CLEANUP_RESPONSE" | jq '.' 2>/dev/null || echo "$CLEANUP_RESPONSE"
echo ""

echo "⏳ 정리 후 잠시 대기..."
sleep 5
echo ""

echo "🧪 테스트: 기존 학생 샘플 (ID 1-20)"
SUCCESS=0
FAIL=0
NO_CODE=0

for ID in {1..20}; do
  CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID")
  
  if echo "$CODE_RESPONSE" | grep -q '"code"'; then
    CODE=$(echo "$CODE_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$CODE" ]; then
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
echo "=== 테스트 결과 ==="
echo "✅ 출석 성공: $SUCCESS"
echo "❌ 출석 실패: $FAIL"
echo "⚠️ 코드 없음: $NO_CODE"

if [ $FAIL -eq 0 ]; then
  echo ""
  echo "🎉 모든 테스트 통과!"
else
  echo ""
  echo "⚠️ 여전히 실패하는 학생이 있습니다"
fi
