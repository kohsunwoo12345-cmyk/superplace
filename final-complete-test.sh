#!/bin/bash

echo "============================================="
echo "최종 완전 테스트 (배포 대기 3분)"
echo "============================================="
echo ""
echo "⏳ Cloudflare Pages 배포 대기..."
sleep 180

TIMESTAMP=$(date +%s)

echo ""
echo "=== 1단계: 새 학생 생성 ==="
STUDENT_EMAIL="final-${TIMESTAMP}@test.com"
STUDENT_NAME="최종테스트${TIMESTAMP}"

CREATE_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$STUDENT_NAME\",
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"test123\",
    \"role\": \"STUDENT\",
    \"academyId\": \"1\"
  }")

echo "학생 생성 응답:"
echo "$CREATE_RESPONSE" | python3 -m json.tool

STUDENT_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('user', {}).get('id', ''))" 2>/dev/null)
CODE_FROM_CREATE=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('attendanceCode', ''))" 2>/dev/null)

echo ""
echo "생성된 학생 ID: $STUDENT_ID"
echo "생성 시 받은 출석 코드: $CODE_FROM_CREATE"

if [ -z "$STUDENT_ID" ]; then
  echo "❌ 학생 생성 실패"
  exit 1
fi

echo ""
echo "=== 2단계: 학생 상세 페이지 API로 출석 코드 조회 (프론트엔드 시나리오) ==="
CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$STUDENT_ID")

echo "출석 코드 조회 응답:"
echo "$CODE_RESPONSE" | python3 -m json.tool

CODE_FROM_API=$(echo "$CODE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('code', ''))" 2>/dev/null)

echo ""
echo "API에서 조회한 출석 코드: $CODE_FROM_API"

if [ -z "$CODE_FROM_API" ] || [ "$CODE_FROM_API" = "null" ]; then
  echo "❌ 출석 코드 조회 실패"
  exit 1
fi

if [ "$CODE_FROM_CREATE" != "$CODE_FROM_API" ]; then
  echo "⚠️  생성 시 코드와 조회 코드가 다릅니다!"
  echo "   생성: $CODE_FROM_CREATE"
  echo "   조회: $CODE_FROM_API"
fi

echo ""
echo "=== 3단계: 조회한 코드로 출석 인증 ==="
VERIFY_RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$CODE_FROM_API\"}")

echo "출석 인증 응답:"
echo "$VERIFY_RESPONSE" | python3 -m json.tool

VERIFY_SUCCESS=$(echo "$VERIFY_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('success', False))" 2>/dev/null)
VERIFY_STUDENT_ID=$(echo "$VERIFY_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('student', {}).get('id', ''))" 2>/dev/null)
VERIFY_STUDENT_NAME=$(echo "$VERIFY_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('student', {}).get('name', ''))" 2>/dev/null)
VERIFY_ERROR=$(echo "$VERIFY_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('error', ''))" 2>/dev/null)

echo ""
if [ "$VERIFY_SUCCESS" = "True" ]; then
  echo "✅ 출석 인증 성공!"
  echo "   학생 ID: $VERIFY_STUDENT_ID"
  echo "   학생 이름: $VERIFY_STUDENT_NAME"
else
  echo "❌ 출석 인증 실패"
  if [ -n "$VERIFY_ERROR" ]; then
    echo "   오류: $VERIFY_ERROR"
  fi
fi

echo ""
echo "============================================="
echo "최종 테스트 결과"
echo "============================================="
echo "1. 학생 생성: $([ -n "$STUDENT_ID" ] && echo "✅ 성공 (ID: $STUDENT_ID)" || echo '❌ 실패')"
echo "2. 출석 코드 생성: $([ -n "$CODE_FROM_CREATE" ] && echo "✅ 성공 (코드: $CODE_FROM_CREATE)" || echo '❌ 실패')"
echo "3. 출석 코드 조회: $([ -n "$CODE_FROM_API" ] && echo "✅ 성공 (코드: $CODE_FROM_API)" || echo '❌ 실패')"
echo "4. 출석 인증: $([ "$VERIFY_SUCCESS" = "True" ] && echo '✅ 성공' || echo '❌ 실패')"
echo "5. 학생 정보 찾기: $([ -n "$VERIFY_STUDENT_ID" ] && echo '✅ 성공' || echo '❌ 실패 - 학생 정보를 찾을 수 없습니다')"
echo "============================================="

if [ "$VERIFY_SUCCESS" = "True" ] && [ -n "$VERIFY_STUDENT_ID" ]; then
  echo ""
  echo "🎉 모든 테스트 통과!"
  echo "   학생 상세 페이지에서 생성된 코드로 출석이 정상 작동합니다."
else
  echo ""
  echo "❌ 테스트 실패 - 추가 디버깅 필요"
fi

