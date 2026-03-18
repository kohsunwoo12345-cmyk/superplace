#!/bin/bash

echo "============================================="
echo "절대 최종 테스트 (배포 대기 3분)"
echo "============================================="
echo ""
echo "⏳ Cloudflare Pages 배포 대기 중..."
sleep 180

echo ""
echo "=== 전체 시나리오 테스트 ==="
TIMESTAMP=$(date +%s)

# 1. 학생 생성
echo "1. 학생 생성"
CREATE=$(curl -s -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"최종확인${TIMESTAMP}\",
    \"email\": \"final-check-${TIMESTAMP}@test.com\",
    \"password\": \"test123\",
    \"role\": \"STUDENT\",
    \"academyId\": \"1\"
  }")

STUDENT_ID=$(echo "$CREATE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('user',{}).get('id',''))" 2>/dev/null)
CODE=$(echo "$CREATE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('attendanceCode',''))" 2>/dev/null)

echo "   학생 ID: $STUDENT_ID"
echo "   출석 코드: $CODE"

if [ -z "$CODE" ]; then
  echo "   ❌ 실패"
  exit 1
fi
echo "   ✅ 성공"

# 2. 출석 인증
echo ""
echo "2. 출석 인증 (사용자가 코드 입력)"
VERIFY=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$CODE\"}")

VERIFY_SUCCESS=$(echo "$VERIFY" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('success',False))" 2>/dev/null)
VERIFY_STUDENT=$(echo "$VERIFY" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('student',{}).get('id',''))" 2>/dev/null)

if [ "$VERIFY_SUCCESS" = "True" ] && [ -n "$VERIFY_STUDENT" ]; then
  echo "   ✅ 성공 (학생 ID: $VERIFY_STUDENT)"
else
  echo "   ❌ 실패"
  echo "$VERIFY" | python3 -m json.tool
fi

# 3. 반 생성
echo ""
echo "3. 반 생성"
TOKEN="1|admin@superplace.co.kr|ADMIN|1"
CLASS=$(curl -s -X POST "https://suplacestudy.com/api/classes/create-new" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"테스트반${TIMESTAMP}\",
    \"grade\": \"고1\",
    \"description\": \"최종 테스트\",
    \"color\": \"#3B82F6\"
  }")

CLASS_SUCCESS=$(echo "$CLASS" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('success',False))" 2>/dev/null)
CLASS_ID=$(echo "$CLASS" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('classId',''))" 2>/dev/null)

if [ "$CLASS_SUCCESS" = "True" ] && [ -n "$CLASS_ID" ]; then
  echo "   ✅ 성공 (Class ID: $CLASS_ID)"
else
  echo "   ❌ 실패"
fi

# 4. 교사 생성
echo ""
echo "4. 교사 생성"
TEACHER=$(curl -s -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"교사${TIMESTAMP}\",
    \"email\": \"teacher-${TIMESTAMP}@test.com\",
    \"password\": \"test123\",
    \"role\": \"TEACHER\",
    \"academyId\": \"1\"
  }")

TEACHER_ID=$(echo "$TEACHER" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('user',{}).get('id',''))" 2>/dev/null)

if [ -n "$TEACHER_ID" ]; then
  echo "   ✅ 성공 (교사 ID: $TEACHER_ID)"
else
  echo "   ❌ 실패"
fi

echo ""
echo "============================================="
echo "최종 결과"
echo "============================================="
echo "1. 학생 생성: $([ -n "$STUDENT_ID" ] && echo '✅' || echo '❌')"
echo "2. 출석 코드 생성: $([ -n "$CODE" ] && echo '✅' || echo '❌')"
echo "3. 출석 인증: $([ "$VERIFY_SUCCESS" = "True" ] && echo '✅' || echo '❌')"
echo "4. 학생 정보 찾기: $([ -n "$VERIFY_STUDENT" ] && echo '✅' || echo '❌')"
echo "5. 반 생성: $([ "$CLASS_SUCCESS" = "True" ] && echo '✅' || echo '❌')"
echo "6. 교사 생성: $([ -n "$TEACHER_ID" ] && echo '✅' || echo '❌')"
echo "============================================="

ALL_SUCCESS=true
[ -z "$STUDENT_ID" ] && ALL_SUCCESS=false
[ -z "$CODE" ] && ALL_SUCCESS=false
[ "$VERIFY_SUCCESS" != "True" ] && ALL_SUCCESS=false
[ -z "$VERIFY_STUDENT" ] && ALL_SUCCESS=false
[ "$CLASS_SUCCESS" != "True" ] && ALL_SUCCESS=false
[ -z "$TEACHER_ID" ] && ALL_SUCCESS=false

if [ "$ALL_SUCCESS" = true ]; then
  echo ""
  echo "🎉 모든 기능 정상 작동!"
  echo ""
  echo "📌 사용자 액션 필요:"
  echo "   브라우저에서 강력 새로고침 (Ctrl+Shift+R 또는 Cmd+Shift+R)"
  echo "   브라우저 캐시 때문에 이전 JavaScript가 실행될 수 있습니다."
else
  echo ""
  echo "❌ 일부 기능 실패"
fi

