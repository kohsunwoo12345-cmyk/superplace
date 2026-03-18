#!/bin/bash

echo "=== 실패한 학생들 상세 분석 ==="
echo ""

for ID in 18 19 20; do
  echo "학생 ID $ID:"
  
  # Get attendance code
  CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID")
  CODE=$(echo "$CODE_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
  echo "  출석 코드: $CODE"
  
  # Try to verify
  VERIFY_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"$CODE\"}")
  
  echo "  인증 응답:"
  echo "$VERIFY_RESPONSE" | jq -r '  
    if .success then 
      "    ✅ 성공" 
    else 
      "    ❌ 실패: " + .error + "\n    디버그: userId=" + (.debug.userId | tostring) + " (type: " + .debug.userIdType + ")"
    end
  ' 2>/dev/null || echo "    Parse error"
  
  echo ""
done

echo "=== 성공한 학생과 실패한 학생 비교 ==="
echo ""
echo "성공 학생 (ID 1):"
curl -s "https://suplacestudy.com/api/students/attendance-code?userId=1" | jq '{userId, code, isActive}'
echo ""
echo "실패 학생 (ID 18):"
curl -s "https://suplacestudy.com/api/students/attendance-code?userId=18" | jq '{userId, code, isActive}'
