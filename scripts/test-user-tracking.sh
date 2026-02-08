#!/bin/bash

# 사용자 상세 정보 추적 기능 테스트 스크립트
BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🧪 사용자 상세 정보 추적 기능 테스트"
echo "======================================"
echo ""

# 1. 마이그레이션 확인
echo "1️⃣  데이터베이스 마이그레이션 확인..."
MIGRATION_RESULT=$(curl -s -X POST "$BASE_URL/api/admin/migrate-users-columns" | jq -r '.success')
if [ "$MIGRATION_RESULT" == "true" ]; then
  echo "   ✅ 마이그레이션 완료 (lastLoginAt, lastLoginIp 컬럼 존재)"
else
  echo "   ❌ 마이그레이션 실패"
  exit 1
fi
echo ""

# 2. 전화번호 포함 회원가입 테스트
echo "2️⃣  전화번호 포함 회원가입 테스트..."
RANDOM_EMAIL="test-$(date +%s)@test.com"
SIGNUP_RESULT=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{
    \"name\": \"테스트사용자\",
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"test1234!\",
    \"phone\": \"010-9999-1234\",
    \"role\": \"STUDENT\"
  }")

USER_ID=$(echo "$SIGNUP_RESULT" | jq -r '.data.user.id')
if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
  echo "   ✅ 회원가입 성공 (사용자 ID: $USER_ID)"
else
  echo "   ❌ 회원가입 실패"
  echo "   응답: $SIGNUP_RESULT"
  exit 1
fi
echo ""

# 3. 로그인 테스트
echo "3️⃣  로그인 테스트 (IP 및 시간 기록)..."
LOGIN_RESULT=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\": \"$RANDOM_EMAIL\", \"password\": \"test1234!\"}")

LOGIN_SUCCESS=$(echo "$LOGIN_RESULT" | jq -r '.success')
if [ "$LOGIN_SUCCESS" == "true" ]; then
  echo "   ✅ 로그인 성공"
else
  echo "   ❌ 로그인 실패"
  exit 1
fi
echo ""

# 잠시 대기 (DB 업데이트 시간)
sleep 2

# 4. 사용자 상세 정보 조회
echo "4️⃣  사용자 상세 정보 조회..."
USER_DETAIL=$(curl -s "$BASE_URL/api/admin/users/$USER_ID")

NAME=$(echo "$USER_DETAIL" | jq -r '.user.name')
EMAIL=$(echo "$USER_DETAIL" | jq -r '.user.email')
PHONE=$(echo "$USER_DETAIL" | jq -r '.user.phone')
LAST_LOGIN_AT=$(echo "$USER_DETAIL" | jq -r '.user.lastLoginAt')
LAST_LOGIN_IP=$(echo "$USER_DETAIL" | jq -r '.user.lastLoginIp')
CREATED_AT=$(echo "$USER_DETAIL" | jq -r '.user.createdAt')

echo "   📋 사용자 정보:"
echo "      이름: $NAME"
echo "      이메일: $EMAIL"
echo "      전화번호: $PHONE"
echo "      가입일: $CREATED_AT"
echo "      마지막 로그인: $LAST_LOGIN_AT"
echo "      마지막 IP: $LAST_LOGIN_IP"
echo ""

# 5. 검증
echo "5️⃣  데이터 검증..."
PASSED=0
FAILED=0

if [ "$PHONE" == "010-9999-1234" ]; then
  echo "   ✅ 전화번호 저장 정상"
  ((PASSED++))
else
  echo "   ❌ 전화번호 저장 실패 (기대: 010-9999-1234, 실제: $PHONE)"
  ((FAILED++))
fi

if [ "$LAST_LOGIN_AT" != "null" ] && [ -n "$LAST_LOGIN_AT" ]; then
  echo "   ✅ 마지막 로그인 시간 기록 정상"
  ((PASSED++))
else
  echo "   ❌ 마지막 로그인 시간 기록 실패"
  ((FAILED++))
fi

if [ "$LAST_LOGIN_IP" != "null" ] && [ -n "$LAST_LOGIN_IP" ]; then
  echo "   ✅ 마지막 로그인 IP 기록 정상"
  ((PASSED++))
else
  echo "   ❌ 마지막 로그인 IP 기록 실패"
  ((FAILED++))
fi
echo ""

# 6. 로그인 기록 조회
echo "6️⃣  로그인 기록 조회..."
LOGIN_LOGS=$(curl -s "$BASE_URL/api/admin/users/$USER_ID/login-logs")
LOG_COUNT=$(echo "$LOGIN_LOGS" | jq -r '.logs | length')

if [ "$LOG_COUNT" -gt 0 ]; then
  echo "   ✅ 로그인 기록 $LOG_COUNT 건 조회됨"
  echo "$LOGIN_LOGS" | jq '.logs[0] | {loginAt, ip, userAgent, success}'
  ((PASSED++))
else
  echo "   ❌ 로그인 기록 없음"
  ((FAILED++))
fi
echo ""

# 최종 결과
echo "======================================"
echo "🎯 테스트 결과: $PASSED/$((PASSED + FAILED)) 통과"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✅ 모든 테스트 통과!"
  echo ""
  echo "📊 기능 확인:"
  echo "   • 전화번호 저장 ✅"
  echo "   • 마지막 로그인 시간 기록 ✅"
  echo "   • 마지막 로그인 IP 기록 ✅"
  echo "   • 로그인 기록 저장 ✅"
  exit 0
else
  echo "❌ $FAILED 개의 테스트 실패"
  exit 1
fi
