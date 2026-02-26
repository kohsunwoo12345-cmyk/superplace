#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 요금제 시스템 전체 플로우 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_BASE="https://superplacestudy.pages.dev"
TEST_USER_ID="test-user-$(date +%s)"
TEST_USER_EMAIL="test@example.com"
TEST_USER_NAME="테스트사용자"

echo "📝 테스트 사용자: $TEST_USER_ID"
echo ""

# ============================================================================
# 1. 요금제 목록 조회
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Step 1: 요금제 목록 조회"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PLANS_RESPONSE=$(curl -s "$API_BASE/api/pricing/plans")
echo "$PLANS_RESPONSE" | jq '.'

# 프로 플랜 ID 추출
PRO_PLAN_ID=$(echo "$PLANS_RESPONSE" | jq -r '.plans[] | select(.name == "프로") | .id')
echo ""
echo "🎯 프로 플랜 ID: $PRO_PLAN_ID"
echo ""

if [ -z "$PRO_PLAN_ID" ] || [ "$PRO_PLAN_ID" = "null" ]; then
  echo "❌ 프로 플랜을 찾을 수 없습니다. 기본 플랜으로 테스트합니다."
  PRO_PLAN_ID="plan-pro"
fi

sleep 2

# ============================================================================
# 2. 관리자: 프로 플랜 제한 수정 (학생 수 10명으로 변경)
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Step 2: 관리자가 프로 플랜 제한 수정 (학생 10명)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

UPDATE_RESPONSE=$(curl -s -X PUT "$API_BASE/api/admin/pricing-plans" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$PRO_PLAN_ID\",
    \"name\": \"프로\",
    \"description\": \"테스트용 수정된 프로 플랜\",
    \"pricing\": {
      \"1month\": 100000,
      \"6months\": 540000,
      \"12months\": 960000
    },
    \"limits\": {
      \"maxStudents\": 10,
      \"maxHomeworkChecks\": 500,
      \"maxAIAnalysis\": 200,
      \"maxSimilarProblems\": 500,
      \"maxLandingPages\": 10
    },
    \"features\": [\"10명 학생 관리\", \"월 500회 숙제 검사\"],
    \"isPopular\": true,
    \"color\": \"#8b5cf6\",
    \"order\": 3,
    \"isActive\": true
  }")

echo "$UPDATE_RESPONSE" | jq '.'
echo ""
sleep 2

# ============================================================================
# 3. 사용자: 프로 플랜 신청
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Step 3: 사용자가 프로 플랜 신청"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REQUEST_RESPONSE=$(curl -s -X POST "$API_BASE/api/subscription/request" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$TEST_USER_ID\",
    \"userEmail\": \"$TEST_USER_EMAIL\",
    \"userName\": \"$TEST_USER_NAME\",
    \"planId\": \"$PRO_PLAN_ID\",
    \"period\": \"1month\",
    \"paymentMethod\": \"card\",
    \"paymentInfo\": {
      \"cardLast4\": \"1234\"
    }
  }")

echo "$REQUEST_RESPONSE" | jq '.'

REQUEST_ID=$(echo "$REQUEST_RESPONSE" | jq -r '.requestId')
echo ""
echo "📋 신청 ID: $REQUEST_ID"
echo ""
sleep 2

# ============================================================================
# 4. 관리자: 신청 승인
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Step 4: 관리자가 신청 승인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

APPROVE_RESPONSE=$(curl -s -X POST "$API_BASE/api/admin/subscription-approvals" \
  -H "Content-Type: application/json" \
  -d "{
    \"requestId\": \"$REQUEST_ID\",
    \"action\": \"approve\",
    \"adminEmail\": \"admin@example.com\",
    \"adminName\": \"관리자\",
    \"adminNote\": \"테스트 승인\"
  }")

echo "$APPROVE_RESPONSE" | jq '.'
echo ""
sleep 2

# ============================================================================
# 5. 사용자 구독 정보 확인
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Step 5: 사용자 구독 정보 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SUB_RESPONSE=$(curl -s "$API_BASE/api/subscription/my-subscription?userId=$TEST_USER_ID")
echo "$SUB_RESPONSE" | jq '.'

# 제한 확인
MAX_STUDENTS=$(echo "$SUB_RESPONSE" | jq -r '.subscription.limits.maxStudents')
echo ""
echo "🎯 학생 수 제한: $MAX_STUDENTS명"
echo ""
sleep 2

# ============================================================================
# 6. 제한 체크: 학생 10명 추가 (성공)
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Step 6: 학생 10명 추가 시도 (제한: $MAX_STUDENTS명)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SUCCESS_COUNT=0
FAIL_COUNT=0

for i in $(seq 1 11); do
  echo "🧑‍🎓 학생 $i 추가 중..."
  
  LIMIT_RESPONSE=$(curl -s -X POST "$API_BASE/api/subscription/check-limit" \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"$TEST_USER_ID\",
      \"type\": \"student\",
      \"action\": \"increment\",
      \"metadata\": {
        \"studentId\": \"student-$i\"
      }
    }")
  
  ALLOWED=$(echo "$LIMIT_RESPONSE" | jq -r '.allowed')
  CURRENT=$(echo "$LIMIT_RESPONSE" | jq -r '.current')
  LIMIT=$(echo "$LIMIT_RESPONSE" | jq -r '.limit')
  
  if [ "$ALLOWED" = "true" ]; then
    echo "  ✅ 성공: $CURRENT/$LIMIT"
    ((SUCCESS_COUNT++))
  else
    ERROR_MSG=$(echo "$LIMIT_RESPONSE" | jq -r '.error')
    echo "  ❌ 차단: $ERROR_MSG"
    ((FAIL_COUNT++))
  fi
  
  sleep 0.5
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 테스트 결과 요약"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "학생 수 제한: $MAX_STUDENTS명"
echo "✅ 성공: $SUCCESS_COUNT명"
echo "❌ 차단: $FAIL_COUNT명"
echo ""

if [ "$SUCCESS_COUNT" = "$MAX_STUDENTS" ] && [ "$FAIL_COUNT" = "1" ]; then
  echo "✅ 제한이 정확히 작동합니다!"
else
  echo "⚠️ 제한이 예상과 다르게 작동합니다."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 전체 테스트 완료"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

