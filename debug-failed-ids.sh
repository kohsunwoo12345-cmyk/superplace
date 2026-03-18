#!/bin/bash

echo "=== 실패 학생 ID 디버그 ==="
echo ""

for ID in 280 290; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "학생 ID $ID 상세 분석"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  echo "1. 출석 코드 조회:"
  CODE_RESP=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID")
  echo "$CODE_RESP" | jq '.'
  
  CODE=$(echo "$CODE_RESP" | jq -r '.code')
  echo ""
  
  echo "2. 출석 인증 시도 (코드: $CODE):"
  VERIFY_RESP=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"$CODE\"}")
  echo "$VERIFY_RESP" | jq '.'
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "학생 수 불일치 조사"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "API가 보고한 총 학생 수: 118명"
echo "실제 예상 학생 수: 291명"
echo "차이: 173명"
echo ""

echo "가능한 원인:"
echo "1. API가 특정 academyId만 조회하고 있음"
echo "2. 학생 역할(role)이 STUDENT가 아닌 경우"
echo "3. 탈퇴(withdrawn) 상태인 학생 제외"
echo ""

echo "실제 STUDENT 역할 사용자 수를 확인하려면"
echo "users 테이블 전체 조회가 필요합니다."
