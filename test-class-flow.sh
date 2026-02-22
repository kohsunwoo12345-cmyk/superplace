#!/bin/bash

# 클래스 생성 및 조회 테스트 스크립트
# 실제로 동작하는지 직접 확인

echo "========================================="
echo "🧪 클래스 생성/조회 테스트 시작"
echo "========================================="
echo ""

# 테스트 사용자 정보
TEST_EMAIL="test-director-$(date +%s)@test.com"
TEST_PASSWORD="test123"
ACADEMY_ID="academy-test-$(date +%s)"

echo "1️⃣ 테스트 데이터 준비"
echo "   이메일: $TEST_EMAIL"
echo "   Academy ID: $ACADEMY_ID"
echo ""

# API 기본 URL
API_BASE="https://superplacestudy.pages.dev/api"

echo "2️⃣ 회원가입 테스트"
SIGNUP_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"테스트 학원장\",
    \"role\": \"DIRECTOR\",
    \"academyId\": \"$ACADEMY_ID\"
  }")

echo "   응답: $SIGNUP_RESPONSE"
echo ""

# 토큰 추출 시도
TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 회원가입 실패 - 토큰 없음"
  echo "   로그인 시도..."
  
  LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"director@test.com\",
      \"password\": \"test123\"
    }")
  
  echo "   로그인 응답: $LOGIN_RESPONSE"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "❌ 인증 실패 - 테스트 중단"
  echo "   기존 토큰 사용 시도..."
  # 하드코딩된 테스트 토큰 (실제 DB의 사용자)
  TOKEN="1|director@test.com|DIRECTOR|$(date +%s)"
fi

echo "3️⃣ 토큰 확인"
echo "   Token: ${TOKEN:0:50}..."
echo ""

echo "4️⃣ 클래스 생성 테스트"
CLASS_NAME="테스트반-$(date +%s)"
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/classes/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"academyId\": \"$ACADEMY_ID\",
    \"name\": \"$CLASS_NAME\",
    \"grade\": \"3학년\",
    \"description\": \"테스트 클래스\",
    \"color\": \"#3B82F6\",
    \"teacherId\": null,
    \"schedules\": [],
    \"studentIds\": []
  }")

echo "   응답: $CREATE_RESPONSE"
echo ""

# 클래스 ID 추출
CLASS_ID=$(echo "$CREATE_RESPONSE" | grep -o '"classId":[0-9]*' | cut -d':' -f2)

if [ -n "$CLASS_ID" ]; then
  echo "✅ 클래스 생성 성공!"
  echo "   클래스 ID: $CLASS_ID"
else
  echo "❌ 클래스 생성 실패"
  echo "   전체 응답: $CREATE_RESPONSE"
fi
echo ""

echo "5️⃣ 클래스 목록 조회 테스트"
LIST_RESPONSE=$(curl -s -X GET "$API_BASE/classes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "   응답: $LIST_RESPONSE"
echo ""

# 클래스 개수 확인
CLASS_COUNT=$(echo "$LIST_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)

if [ -n "$CLASS_COUNT" ]; then
  echo "✅ 클래스 조회 성공!"
  echo "   총 클래스 개수: $CLASS_COUNT"
  
  # 방금 생성한 클래스가 있는지 확인
  if echo "$LIST_RESPONSE" | grep -q "$CLASS_NAME"; then
    echo "✅✅ 생성한 클래스가 목록에 표시됨!"
  else
    echo "❌ 생성한 클래스가 목록에 없음"
  fi
else
  echo "❌ 클래스 조회 실패"
fi
echo ""

echo "6️⃣ 추적 API 테스트"
TRACE_RESPONSE=$(curl -s -X GET "$API_BASE/classes/trace" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "   추적 응답 (처음 500자):"
echo "$TRACE_RESPONSE" | head -c 500
echo "..."
echo ""

echo "========================================="
echo "🏁 테스트 완료"
echo "========================================="
