#!/bin/bash

echo "=== 최종 전체 테스트 ==="

echo ""
echo "1. 기존 학생 ID 1 테스트"
CODE1=$(curl -s "https://suplacestudy.com/api/attendance/code?userId=1" | python3 -c "import sys, json; print(json.load(sys.stdin).get('code',''))" 2>/dev/null)
echo "   코드: $CODE1"

if [ -n "$CODE1" ] && [ "$CODE1" != "null" ]; then
  VERIFY1=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" -H "Content-Type: application/json" -d "{\"code\":\"$CODE1\"}")
  SUCCESS1=$(echo "$VERIFY1" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success',False))" 2>/dev/null)
  
  if [ "$SUCCESS1" = "True" ]; then
    echo "   ✅ 출석 성공"
  else
    echo "   ❌ 출석 실패"
  fi
else
  echo "   ⚠️ 코드 없음"
fi

echo ""
echo "2. 새 학생 생성 및 테스트"
TS=$(date +%s)
CREATE=$(curl -s -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"최종${TS}\",\"email\":\"final${TS}@test.com\",\"password\":\"test\",\"role\":\"STUDENT\",\"academyId\":\"1\"}")

STUDENT_ID=$(echo "$CREATE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user',{}).get('id',''))" 2>/dev/null)
CODE2=$(echo "$CREATE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('attendanceCode',''))" 2>/dev/null)

echo "   학생 ID: $STUDENT_ID"
echo "   코드: $CODE2"

if [ -n "$CODE2" ]; then
  VERIFY2=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" -H "Content-Type: application/json" -d "{\"code\":\"$CODE2\"}")
  SUCCESS2=$(echo "$VERIFY2" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success',False))" 2>/dev/null)
  
  if [ "$SUCCESS2" = "True" ]; then
    echo "   ✅ 출석 성공"
  else
    echo "   ❌ 출석 실패"
  fi
fi

echo ""
echo "=== 결과 요약 ==="
echo "기존 학생: $([ "$SUCCESS1" = "True" ] && echo '✅ 작동' || echo '❌ 실패 또는 코드 없음')"
echo "신규 학생: $([ "$SUCCESS2" = "True" ] && echo '✅ 작동' || echo '❌ 실패')"

