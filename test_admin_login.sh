#!/bin/bash
echo "=== 🔐 admin 계정 로그인 테스트 ==="
echo ""

echo "1️⃣ admin@superplace.co.kr 로그인 테스트"
RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.co.kr","password":"admin123"}')

echo "응답:"
echo "$RESPONSE" | jq '.'

echo ""
echo "2️⃣ user.role 값 확인"
echo "$RESPONSE" | jq -r '.data.user.role // "role이 없음"'

echo ""
echo "3️⃣ 대문자로 변환 후 확인"
ROLE=$(echo "$RESPONSE" | jq -r '.data.user.role // ""')
echo "원본 role: $ROLE"
echo "대문자 role: ${ROLE^^}"

echo ""
echo "4️⃣ 허용된 역할 목록"
echo "- ADMIN"
echo "- SUPER_ADMIN"
echo "- DIRECTOR"
echo "- MEMBER"

echo ""
echo "5️⃣ 매칭 확인"
if [[ "${ROLE^^}" == "ADMIN" ]] || [[ "${ROLE^^}" == "SUPER_ADMIN" ]] || [[ "${ROLE^^}" == "DIRECTOR" ]] || [[ "${ROLE^^}" == "MEMBER" ]]; then
    echo "✅ 접근 가능"
else
    echo "❌ 접근 불가: role = $ROLE (대문자: ${ROLE^^})"
fi
