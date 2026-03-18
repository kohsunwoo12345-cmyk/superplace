#!/bin/bash

echo "=== 긴급 디버깅: 실제 사용자 시나리오 테스트 ==="
echo ""

# 1. 새 학생 생성
TIMESTAMP=$(date +%s)
STUDENT_EMAIL="user-${TIMESTAMP}@test.com"

echo "1. 학생 생성"
CREATE_RESP=$(curl -s -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"긴급테스트${TIMESTAMP}\",
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"test123\",
    \"role\": \"STUDENT\",
    \"academyId\": \"1\"
  }")

echo "$CREATE_RESP" | python3 -m json.tool
STUDENT_ID=$(echo "$CREATE_RESP" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('user',{}).get('id',''))" 2>/dev/null)
CODE=$(echo "$CREATE_RESP" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('attendanceCode',''))" 2>/dev/null)

echo ""
echo "생성된 학생 ID: $STUDENT_ID"
echo "출석 코드: $CODE"

if [ -z "$CODE" ]; then
  echo "❌ 코드 없음"
  exit 1
fi

echo ""
echo "2. 출석 코드로 즉시 인증 (사용자가 입력하는 시나리오)"
VERIFY=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$CODE\"}")

echo "$VERIFY" | python3 -m json.tool

SUCCESS=$(echo "$VERIFY" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('success',False))" 2>/dev/null)
ERROR=$(echo "$VERIFY" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)

echo ""
if [ "$SUCCESS" = "True" ]; then
  echo "✅ 성공!"
else
  echo "❌ 실패: $ERROR"
  
  # 상세 디버깅
  echo ""
  echo "3. 출석 코드 테이블 직접 확인"
  curl -s "https://suplacestudy.com/api/attendance/code?userId=$STUDENT_ID" | python3 -m json.tool
  
  echo ""
  echo "4. student_attendance_codes에서 해당 코드 검색"
  # API가 없으므로 verify 로그 확인
fi

echo ""
echo "=== 반 생성 테스트 ==="
# 관리자 토큰 필요 - localStorage에서 가져와야 함
echo "반 생성은 인증 토큰이 필요합니다."
echo "프론트엔드에서 직접 테스트하거나 토큰을 제공해주세요."

