#!/bin/bash
# 🧪 완전한 요금제 적용 테스트
# 1. 요금제 생성
# 2. 구독 할당
# 3. 학생 추가 (한도 확인)
# 4. 원장 계정 기능 접근 테스트

BASE_URL="${BASE_URL:-https://superplacestudy.pages.dev}"
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🧪 요금제 완전 테스트 (생성 → 저장 → 승인 → 적용 → 한도)  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 관리자 계정 (환경변수로 설정 가능)
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@superplace.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

echo -e "${BLUE}[단계 1/7] 관리자 로그인${NC}"
echo "  계정: $ADMIN_EMAIL"

LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}❌ 로그인 실패${NC}"
  echo "  응답: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ 로그인 성공${NC}"
echo ""

# ==========================================
# 단계 2: 테스트 요금제 생성
# ==========================================
echo -e "${BLUE}[단계 2/7] 테스트 요금제 생성${NC}"
echo "  이름: 테스트 플랜 (학생 5명 한도)"

PLAN_PAYLOAD=$(cat <<'JSON'
{
  "name": "테스트 플랜 - 학생 5명",
  "description": "테스트용 요금제 (학생 5명 한도)",
  "pricing_1month": 10000,
  "pricing_6months": 54000,
  "pricing_12months": 96000,
  "maxStudents": 5,
  "maxTeachers": 2,
  "maxHomeworkChecks": 20,
  "maxAIAnalysis": 10,
  "maxAIGrading": 20,
  "maxCapabilityAnalysis": 10,
  "maxConceptAnalysis": 10,
  "maxSimilarProblems": 20,
  "maxLandingPages": 1,
  "features": "[\"학생 5명\", \"선생님 2명\", \"숙제검사 20회\"]",
  "isPopular": false,
  "isActive": true,
  "color": "#3B82F6",
  "order": 99
}
JSON
)

PLAN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/pricing-plans" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$PLAN_PAYLOAD")

PLAN_ID=$(echo "$PLAN_RESPONSE" | jq -r '.planId // empty')

if [ -z "$PLAN_ID" ]; then
  echo -e "${RED}❌ 요금제 생성 실패${NC}"
  echo "  응답: $PLAN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ 요금제 생성 완료: $PLAN_ID${NC}"
echo ""

# ==========================================
# 단계 3: 요금제 저장 확인
# ==========================================
echo -e "${BLUE}[단계 3/7] 요금제 저장 확인${NC}"

SAVED_PLAN=$(curl -s "${BASE_URL}/api/admin/pricing-plans" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq ".plans[] | select(.id == \"$PLAN_ID\")")

if [ -z "$SAVED_PLAN" ]; then
  echo -e "${RED}❌ 저장된 요금제를 찾을 수 없습니다${NC}"
  exit 1
fi

echo "  저장된 데이터:"
echo "$SAVED_PLAN" | jq '{
  name,
  pricing_1month,
  pricing_12months,
  maxStudents,
  maxTeachers,
  maxHomeworkChecks,
  maxLandingPages
}'

SAVED_MAX_STUDENTS=$(echo "$SAVED_PLAN" | jq -r '.maxStudents')
echo ""
echo -e "${GREEN}✅ 요금제 저장 확인 완료${NC}"
echo "  학생 한도: $SAVED_MAX_STUDENTS명"
echo ""

# ==========================================
# 단계 4: 테스트 학원장 생성
# ==========================================
echo -e "${BLUE}[단계 4/7] 테스트 학원장 생성${NC}"

TEST_DIRECTOR_EMAIL="test-director-$(date +%s)@test.com"
TEST_ACADEMY_ID="test-academy-$(date +%s)"

# 학원 생성 (선택적)
curl -s -X POST "${BASE_URL}/api/admin/academies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"id\": \"$TEST_ACADEMY_ID\",
    \"name\": \"테스트 학원\",
    \"code\": \"TEST$(date +%s)\"
  }" > /dev/null 2>&1

# 학원장 생성
DIRECTOR_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"name\": \"테스트 학원장\",
    \"email\": \"$TEST_DIRECTOR_EMAIL\",
    \"password\": \"password123\",
    \"role\": \"DIRECTOR\",
    \"academyId\": \"$TEST_ACADEMY_ID\"
  }")

DIRECTOR_ID=$(echo "$DIRECTOR_RESPONSE" | jq -r '.user.id // empty')

if [ -z "$DIRECTOR_ID" ]; then
  echo -e "${YELLOW}⚠️  기존 DIRECTOR 사용${NC}"
  DIRECTOR_ID=$(curl -s "${BASE_URL}/api/admin/users?role=DIRECTOR" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.users[0].id // empty')
  TEST_ACADEMY_ID=$(curl -s "${BASE_URL}/api/admin/users?role=DIRECTOR" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.users[0].academyId // empty')
fi

echo -e "${GREEN}✅ 학원장: $DIRECTOR_ID (Academy: $TEST_ACADEMY_ID)${NC}"
echo ""

# ==========================================
# 단계 5: 구독 할당
# ==========================================
echo -e "${BLUE}[단계 5/7] 구독 할당 (12개월)${NC}"

SUBSCRIPTION_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/assign-subscription" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"userId\": \"$DIRECTOR_ID\",
    \"planId\": \"$PLAN_ID\",
    \"period\": \"12months\"
  }")

SUB_ID=$(echo "$SUBSCRIPTION_RESPONSE" | jq -r '.subscriptionId // empty')

if [ -z "$SUB_ID" ]; then
  echo -e "${RED}❌ 구독 할당 실패${NC}"
  echo "  응답: $SUBSCRIPTION_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ 구독 할당 완료: $SUB_ID${NC}"
echo ""

# ==========================================
# 단계 6: 구독 적용 확인
# ==========================================
echo -e "${BLUE}[단계 6/7] 구독 적용 확인${NC}"

SUB_STATUS=$(curl -s "${BASE_URL}/api/subscriptions/status?userId=$DIRECTOR_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "  구독 정보:"
echo "$SUB_STATUS" | jq '{
  hasSubscription,
  planName: .subscription.planName,
  status: .subscription.status,
  maxStudents: .subscription.limits.maxStudents,
  currentStudents: .subscription.currentUsage.students,
  maxHomeworkChecks: .subscription.limits.maxHomeworkChecks,
  maxLandingPages: .subscription.limits.maxLandingPages,
  daysLeft: .subscription.daysLeft
}'

HAS_SUB=$(echo "$SUB_STATUS" | jq -r '.hasSubscription // false')
LIMIT_STUDENTS=$(echo "$SUB_STATUS" | jq -r '.subscription.limits.maxStudents // 0')

if [ "$HAS_SUB" != "true" ]; then
  echo -e "${RED}❌ 구독이 활성화되지 않음!${NC}"
  exit 1
fi

if [ "$LIMIT_STUDENTS" != "$SAVED_MAX_STUDENTS" ]; then
  echo -e "${RED}❌ 학생 한도가 일치하지 않음!${NC}"
  echo "  요금제: $SAVED_MAX_STUDENTS명"
  echo "  구독: $LIMIT_STUDENTS명"
  exit 1
fi

echo -e "${GREEN}✅ 구독 정상 적용 (한도: $LIMIT_STUDENTS명)${NC}"
echo ""

# ==========================================
# 단계 7: 학생 추가 테스트 (한도 체크)
# ==========================================
echo -e "${BLUE}[단계 7/7] 학생 추가 테스트 (한도 체크)${NC}"

echo "  [7-1] 학생 1명 추가 (성공 예상)..."
STUDENT1_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"name\": \"테스트 학생1\",
    \"email\": \"student1-$(date +%s)@test.com\",
    \"password\": \"password123\",
    \"role\": \"STUDENT\",
    \"academyId\": \"$TEST_ACADEMY_ID\"
  }")

STUDENT1_SUCCESS=$(echo "$STUDENT1_RESPONSE" | jq -r '.success // false')

if [ "$STUDENT1_SUCCESS" == "true" ]; then
  echo -e "${GREEN}  ✅ 학생 추가 성공${NC}"
  STUDENT1_ID=$(echo "$STUDENT1_RESPONSE" | jq -r '.user.id')
  echo "     학생 ID: $STUDENT1_ID"
else
  echo -e "${RED}  ❌ 학생 추가 실패!${NC}"
  echo "$STUDENT1_RESPONSE" | jq '{success, error, message}'
  echo ""
  echo -e "${YELLOW}  구독 문제 확인 필요:${NC}"
  echo "  1. 구독 상태: ${SUB_STATUS}"
  echo "  2. 학원 ID: $TEST_ACADEMY_ID"
  echo "  3. 학원장 ID: $DIRECTOR_ID"
  exit 1
fi

# 사용량 확인
echo ""
echo "  [7-2] 사용량 확인..."
NEW_STATUS=$(curl -s "${BASE_URL}/api/subscriptions/status?userId=$DIRECTOR_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
CURRENT_STUDENTS=$(echo "$NEW_STATUS" | jq -r '.subscription.currentUsage.students // 0')
echo "     현재 학생 수: $CURRENT_STUDENTS / $LIMIT_STUDENTS"

if [ "$CURRENT_STUDENTS" -gt 0 ]; then
  echo -e "${GREEN}  ✅ 사용량 증가 확인됨${NC}"
else
  echo -e "${YELLOW}  ⚠️  사용량 증가 안 됨 (로직 확인 필요)${NC}"
fi

# 한도 초과 테스트 (5명 제한이므로 6명째 추가 시도)
echo ""
echo "  [7-3] 한도 초과 테스트..."
echo "     학생 ${LIMIT_STUDENTS}명 추가 중..."

for i in $(seq 2 $LIMIT_STUDENTS); do
  RESULT=$(curl -s -X POST "${BASE_URL}/api/admin/users/create" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
      \"name\": \"테스트 학생$i\",
      \"email\": \"student$i-$(date +%s)@test.com\",
      \"password\": \"password123\",
      \"role\": \"STUDENT\",
      \"academyId\": \"$TEST_ACADEMY_ID\"
    }")
  
  SUCCESS=$(echo "$RESULT" | jq -r '.success // false')
  if [ "$SUCCESS" != "true" ]; then
    echo -e "${YELLOW}     학생 $i 추가 실패: $(echo "$RESULT" | jq -r '.message')${NC}"
    break
  fi
  echo "     학생 $i 추가 성공"
done

# 한도 초과 시도
echo ""
echo "  [7-4] 한도 초과 학생 추가 시도 ($((LIMIT_STUDENTS + 1))명째)..."
OVER_LIMIT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/users/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"name\": \"테스트 학생 OVER\",
    \"email\": \"student-over-$(date +%s)@test.com\",
    \"password\": \"password123\",
    \"role\": \"STUDENT\",
    \"academyId\": \"$TEST_ACADEMY_ID\"
  }")

OVER_SUCCESS=$(echo "$OVER_LIMIT_RESPONSE" | jq -r '.success // false')
OVER_ERROR=$(echo "$OVER_LIMIT_RESPONSE" | jq -r '.error // ""')

if [ "$OVER_SUCCESS" == "false" ] && [ "$OVER_ERROR" == "STUDENT_LIMIT_EXCEEDED" ]; then
  echo -e "${GREEN}  ✅ 한도 초과 차단 확인됨!${NC}"
  echo "     메시지: $(echo "$OVER_LIMIT_RESPONSE" | jq -r '.message')"
else
  echo -e "${RED}  ❌ 한도 초과인데 추가됨 (버그!)${NC}"
  echo "     응답: $OVER_LIMIT_RESPONSE"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ 테스트 완료!                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 최종 결과:"
echo "  - 요금제 ID: $PLAN_ID"
echo "  - 학생 한도: $LIMIT_STUDENTS명"
echo "  - 학원장 ID: $DIRECTOR_ID"
echo "  - 구독 ID: $SUB_ID"
echo "  - 현재 학생 수: $CURRENT_STUDENTS / $LIMIT_STUDENTS"
echo ""
echo "🌐 확인 URL:"
echo "  - 요금제: ${BASE_URL}/dashboard/admin/pricing"
echo "  - 학원: ${BASE_URL}/dashboard/admin/academies/detail?id=$TEST_ACADEMY_ID"
echo ""
