#!/bin/bash

echo "=== 긴급 디버깅 (30초 대기) ==="
sleep 30

echo ""
echo "1. 새 학생 생성 및 즉시 출석 테스트"
TS=$(date +%s)

CREATE=$(curl -s -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"긴급${TS}\",\"email\":\"urgent${TS}@test.com\",\"password\":\"test\",\"role\":\"STUDENT\",\"academyId\":\"1\"}")

STUDENT_ID=$(echo "$CREATE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user',{}).get('id',''))" 2>/dev/null)
CODE=$(echo "$CREATE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('attendanceCode',''))" 2>/dev/null)

echo "학생 ID: $STUDENT_ID"
echo "출석 코드: $CODE"

if [ -z "$CODE" ]; then
  echo "❌ 코드 생성 실패"
  exit 1
fi

echo ""
echo "2. 출석 코드로 즉시 인증 (디버그 정보 포함)"
VERIFY=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$CODE\"}")

echo "$VERIFY" | python3 -m json.tool

SUCCESS=$(echo "$VERIFY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success',False))" 2>/dev/null)

if [ "$SUCCESS" = "True" ]; then
  echo ""
  echo "✅ 성공!"
else
  echo ""
  echo "❌ 실패 - 디버그 정보 확인"
  echo "$VERIFY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'debug' in data:
    print('\n디버그 정보:')
    print(f'  userId: {data[\"debug\"].get(\"userId\")}')
    print(f'  userId 타입: {data[\"debug\"].get(\"userIdType\")}')
    print(f'  샘플 사용자:')
    for u in data['debug'].get('sampleUsers', []):
        print(f'    - ID {u[\"id\"]}: {u[\"name\"]}')
"
fi

