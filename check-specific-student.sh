#!/bin/bash

echo "=== 주해성 학생 출석 코드 조회 ==="
echo ""

echo "1. 이름으로 학생 검색 (users 테이블)..."
# Note: This would need an API endpoint to search by name
# For now, let's check a range of student IDs

echo "2. ID 범위별 학생 확인 (이름 포함)..."
for ID in {1..30}; do
  CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID")
  
  if echo "$CODE_RESPONSE" | grep -q '"success":true'; then
    CODE=$(echo "$CODE_RESPONSE" | jq -r '.code // "없음"')
    IS_ACTIVE=$(echo "$CODE_RESPONSE" | jq -r '.isActive // 0')
    
    # Try to get student name from another endpoint
    # For now, just show the code info
    if [ "$IS_ACTIVE" = "1" ]; then
      echo "  학생 ID $ID: 코드 $CODE (활성)"
    fi
  fi
done

echo ""
echo "3. 학생 이름으로 직접 검색 필요..."
echo "학생의 이메일이나 정확한 ID를 알려주시면 더 정확히 확인할 수 있습니다."
