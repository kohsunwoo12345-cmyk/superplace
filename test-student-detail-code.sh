#!/bin/bash

echo "=== 학생 상세 페이지 출석 코드 테스트 ==="

# 1. 새 학생 생성
TS=$(date +%s)
echo "1. 학생 생성"
CREATE=$(curl -s -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"상세테스트${TS}\",\"email\":\"detail${TS}@test.com\",\"password\":\"test\",\"role\":\"STUDENT\",\"academyId\":\"1\"}")

STUDENT_ID=$(echo "$CREATE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user',{}).get('id',''))" 2>/dev/null)
CODE_FROM_CREATE=$(echo "$CREATE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('attendanceCode',''))" 2>/dev/null)

echo "   학생 ID: $STUDENT_ID"
echo "   생성 시 코드: $CODE_FROM_CREATE"

# 2. 학생 상세 페이지 API 호출 (프론트엔드가 하는 것처럼)
echo ""
echo "2. 학생 상세 페이지 출석 코드 조회"
DETAIL_CODE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$STUDENT_ID")
echo "$DETAIL_CODE" | python3 -m json.tool

CODE_FROM_DETAIL=$(echo "$DETAIL_CODE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('code',''))" 2>/dev/null)
echo ""
echo "   상세 페이지 코드: $CODE_FROM_DETAIL"

# 3. 상세 페이지 코드로 출석
echo ""
echo "3. 상세 페이지 코드로 출석 시도"
VERIFY=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$CODE_FROM_DETAIL\"}")

echo "$VERIFY" | python3 -m json.tool

SUCCESS=$(echo "$VERIFY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success',False))" 2>/dev/null)

echo ""
if [ "$SUCCESS" = "True" ]; then
  echo "✅ 학생 상세 페이지 코드로 출석 성공!"
else
  echo "❌ 학생 상세 페이지 코드로 출석 실패"
  ERROR=$(echo "$VERIFY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error',''))" 2>/dev/null)
  echo "   오류: $ERROR"
fi

