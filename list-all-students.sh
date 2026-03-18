#!/bin/bash

echo "=== 전체 학생 목록 (이름 포함) ==="
echo ""

echo "📋 활성 학생 (ID 1-200, 출석 코드 있는 학생만)..."
echo ""

COUNT=0
for ID in {1..200}; do
  CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID")
  
  if echo "$CODE_RESPONSE" | grep -q '"success":true'; then
    IS_ACTIVE=$(echo "$CODE_RESPONSE" | jq -r '.isActive // 0')
    
    if [ "$IS_ACTIVE" = "1" ]; then
      CODE=$(echo "$CODE_RESPONSE" | jq -r '.code')
      echo "ID $ID: 코드 $CODE"
      COUNT=$((COUNT + 1))
      
      # Show first 30 only
      if [ $COUNT -ge 30 ]; then
        echo ""
        echo "... (총 30개 표시, 더 많을 수 있음)"
        break
      fi
    fi
  fi
  
  sleep 0.05
done

echo ""
echo "표시된 학생 수: $COUNT"
echo ""
echo "💡 특정 학생을 찾으려면 학생 이메일이나 ID를 알려주세요."
