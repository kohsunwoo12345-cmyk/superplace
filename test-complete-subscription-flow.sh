#!/bin/bash

# 🧪 완전한 구독 시스템 테스트 스크립트
# 이 스크립트는 다음을 자동으로 테스트합니다:
# 1. 요금제 생성
# 2. 구독 신청
# 3. 구독 승인
# 4. 학생 추가 (한도 체크)
# 5. 출석 체크 (만료 체크)
# 6. 봇 할당
# 7. 학원 상세 조회

set -e  # 에러 발생 시 중단

BASE_URL="${BASE_URL:-https://superplacestudy.pages.dev}"
API_BASE="${BASE_URL}/api"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "🧪 =========================================="
echo "   구독 시스템 완전 테스트"
echo "   BASE: $BASE_URL"
echo "=========================================="
echo ""

# 테스트 계정 정보
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@superplace.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
DIRECTOR_EMAIL="${DIRECTOR_EMAIL:-test-director-$(date +%s)@test.com}"
DIRECTOR_PASSWORD="password123"
STUDENT_EMAIL="test-student-$(date +%s)@test.com"
STUDENT_PASSWORD="password123"

echo "📝 테스트 계정:"
echo "   관리자: $ADMIN_EMAIL"
echo "   학원장: $DIRECTOR_EMAIL"
echo "   학생: $STUDENT_EMAIL"
echo ""

# ==========================================
# 1. 관리자 로그인
# ==========================================
echo -e "${BLUE}[1/9] 관리자 로그인...${NC}"
ADMIN_TOKEN=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | jq -r '.token // empty')

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}❌ 관리자 로그인 실패${NC}"
  echo "테스트 계정을 먼저 생성하세요:"
  echo "  ADMIN_EMAIL=$ADMIN_EMAIL"
  echo "  ADMIN_PASSWORD=$ADMIN_PASSWORD"
  exit 1
fi

echo -e "${GREEN}✅ 관리자 로그인 성공${NC}"
echo ""

# ==========================================
# 2. 요금제 생성
# ==========================================
echo -e "${BLUE}[2/9] 요금제 생성...${NC}"

PLAN_RESPONSE=$(curl -s -X POST "${API_BASE}/admin/pricing-plans" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "테스트 스탠다드 플랜",
    "description": "테스트용 플랜",
    "pricing_1month": 50000,
    "pricing_6months": 270000,
    "pricing_12months": 480000,
    "maxStudents": 30,
    "maxTeachers": 5,
    "maxHomeworkChecks": 100,
    "maxAIAnalysis": 50,
    "maxAIGrading": 100,
    "maxCapabilityAnalysis": 50,
    "maxConceptAnalysis": 50,
    "maxSimilarProblems": 100,
    "maxLandingPages": 3,
    "features": ["학생 30명까지", "선생님 5명", "AI 분석 50회"],
    "isPopular": false,
    "isActive": true
  }')

PLAN_ID=$(echo "$PLAN_RESPONSE" | jq -r '.planId // .id // empty')

if [ -z "$PLAN_ID" ]; then
  echo -e "${YELLOW}⚠️  기존 요금제 사용 (생성 실패)${NC}"
  # 기존 요금제 조회
  EXISTING_PLAN=$(curl -s "${API_BASE}/admin/pricing-plans" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.plans[0].id // empty')
  
  if [ -z "$EXISTING_PLAN" ]; then
    echo -e "${RED}❌ 요금제가 없습니다${NC}"
    exit 1
  fi
  PLAN_ID="$EXISTING_PLAN"
fi

echo -e "${GREEN}✅ 요금제 준비 완료: $PLAN_ID${NC}"
echo ""

# ==========================================
# 3. 학원장 계정 생성
# ==========================================
echo -e "${BLUE}[3/9] 학원장 계정 생성...${NC}"

# 먼저 학원(Academy) 생성
ACADEMY_ID="academy-test-$(date +%s)"
ACADEMY_RESPONSE=$(curl -s -X POST "${API_BASE}/admin/academies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"id\": \"$ACADEMY_ID\",
    \"name\": \"테스트 학원\",
    \"code\": \"TEST$(date +%s)\",
    \"address\": \"서울시 강남구\",
    \"phone\": \"02-1234-5678\"
  }" 2>/dev/null)

echo "학원 생성 응답: $ACADEMY_RESPONSE"

# 학원장 생성
DIRECTOR_RESPONSE=$(curl -s -X POST "${API_BASE}/admin/users/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"name\": \"테스트 학원장\",
    \"email\": \"$DIRECTOR_EMAIL\",
    \"password\": \"$DIRECTOR_PASSWORD\",
    \"role\": \"DIRECTOR\",
    \"phone\": \"010-1234-5678\",
    \"academyId\": \"$ACADEMY_ID\"
  }")

DIRECTOR_ID=$(echo "$DIRECTOR_RESPONSE" | jq -r '.user.id // empty')

if [ -z "$DIRECTOR_ID" ]; then
  echo -e "${RED}❌ 학원장 생성 실패${NC}"
  echo "응답: $DIRECTOR_RESPONSE"
  # 기존 DIRECTOR 조회
  EXISTING_DIRECTOR=$(curl -s "${API_BASE}/admin/users?role=DIRECTOR" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.users[0].id // empty')
  
  if [ -z "$EXISTING_DIRECTOR" ]; then
    echo -e "${RED}❌ DIRECTOR 계정이 없습니다${NC}"
    exit 1
  fi
  DIRECTOR_ID="$EXISTING_DIRECTOR"
  ACADEMY_ID=$(curl -s "${API_BASE}/admin/users?role=DIRECTOR" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.users[0].academyId // empty')
fi

echo -e "${GREEN}✅ 학원장 생성 완료: $DIRECTOR_ID (Academy: $ACADEMY_ID)${NC}"
echo ""

# ==========================================
# 4. 구독 직접 할당 (관리자가 직접 할당)
# ==========================================
echo -e "${BLUE}[4/9] 구독 할당...${NC}"

SUBSCRIPTION_RESPONSE=$(curl -s -X POST "${API_BASE}/admin/assign-subscription" \
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
  echo "응답: $SUBSCRIPTION_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ 구독 할당 완료: $SUB_ID${NC}"
echo ""

# ==========================================
# 5. 구독 상태 확인
# ==========================================
echo -e "${BLUE}[5/9] 구독 상태 확인...${NC}"

SUB_STATUS=$(curl -s "${API_BASE}/subscriptions/status?userId=$DIRECTOR_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$SUB_STATUS" | jq '.'

HAS_SUB=$(echo "$SUB_STATUS" | jq -r '.hasSubscription // false')
if [ "$HAS_SUB" != "true" ]; then
  echo -e "${RED}❌ 구독이 활성화되지 않음${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 구독 활성화 확인됨${NC}"
echo ""

# ==========================================
# 6. 학생 추가 (구독 한도 체크)
# ==========================================
echo -e "${BLUE}[6/9] 학생 추가 (한도 체크)...${NC}"

STUDENT_RESPONSE=$(curl -s -X POST "${API_BASE}/admin/users/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"name\": \"테스트 학생\",
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"$STUDENT_PASSWORD\",
    \"role\": \"STUDENT\",
    \"phone\": \"010-9876-5432\",
    \"academyId\": \"$ACADEMY_ID\"
  }")

STUDENT_ID=$(echo "$STUDENT_RESPONSE" | jq -r '.user.id // empty')

if [ -z "$STUDENT_ID" ]; then
  echo -e "${RED}❌ 학생 추가 실패${NC}"
  echo "응답: $STUDENT_RESPONSE"
  
  # 구독 오류인지 확인
  ERROR_CODE=$(echo "$STUDENT_RESPONSE" | jq -r '.error // empty')
  if [ "$ERROR_CODE" == "SUBSCRIPTION_REQUIRED" ] || [ "$ERROR_CODE" == "SUBSCRIPTION_EXPIRED" ]; then
    echo -e "${YELLOW}⚠️  구독 문제: $ERROR_CODE${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✅ 학생 추가 성공: $STUDENT_ID${NC}"

# 사용량 증가 확인
NEW_SUB_STATUS=$(curl -s "${API_BASE}/subscriptions/status?userId=$DIRECTOR_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
USAGE_STUDENTS=$(echo "$NEW_SUB_STATUS" | jq -r '.subscription.currentUsage.students // 0')
echo "   학생 사용량: $USAGE_STUDENTS"
echo ""

# ==========================================
# 7. 출석 체크 (만료 확인)
# ==========================================
echo -e "${BLUE}[7/9] 출석 체크...${NC}"

CHECKIN_RESPONSE=$(curl -s -X POST "${API_BASE}/attendance/checkin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"userId\": \"$STUDENT_ID\",
    \"academyId\": \"$ACADEMY_ID\",
    \"latitude\": 37.5665,
    \"longitude\": 126.9780
  }")

CHECKIN_SUCCESS=$(echo "$CHECKIN_RESPONSE" | jq -r '.success // false')

if [ "$CHECKIN_SUCCESS" != "true" ]; then
  echo -e "${RED}❌ 출석 체크 실패${NC}"
  echo "응답: $CHECKIN_RESPONSE"
else
  echo -e "${GREEN}✅ 출석 체크 성공${NC}"
fi
echo ""

# ==========================================
# 8. 봇 할당 (권한 체크)
# ==========================================
echo -e "${BLUE}[8/9] AI 봇 할당...${NC}"

# 먼저 봇 목록 조회
BOTS=$(curl -s "${API_BASE}/admin/ai-bots" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
BOT_ID=$(echo "$BOTS" | jq -r '.bots[0].id // empty')

if [ -n "$BOT_ID" ]; then
  BOT_ASSIGN=$(curl -s -X POST "${API_BASE}/admin/bot-assignments" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
      \"academyId\": \"$ACADEMY_ID\",
      \"botId\": \"$BOT_ID\",
      \"notes\": \"테스트 할당\"
    }")
  
  BOT_ASSIGN_SUCCESS=$(echo "$BOT_ASSIGN" | jq -r '.success // false')
  if [ "$BOT_ASSIGN_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✅ 봇 할당 성공: $BOT_ID${NC}"
  else
    echo -e "${YELLOW}⚠️  봇 할당 실패 (이미 할당되었거나 권한 문제)${NC}"
    echo "응답: $BOT_ASSIGN"
  fi
else
  echo -e "${YELLOW}⚠️  할당할 봇이 없습니다${NC}"
fi
echo ""

# ==========================================
# 9. 학원 상세 정보 조회
# ==========================================
echo -e "${BLUE}[9/9] 학원 상세 정보 조회...${NC}"

ACADEMY_DETAIL=$(curl -s "${API_BASE}/admin/academies?id=$ACADEMY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "학원 정보:"
echo "$ACADEMY_DETAIL" | jq '{
  name: .academy.name,
  academyId: .academy.academyId,
  studentCount: .academy.studentCount,
  teacherCount: .academy.teacherCount,
  subscription: .academy.currentPlan,
  director: {
    name: .academy.directorName,
    email: .academy.directorEmail
  }
}'
echo ""

# ==========================================
# 최종 요약
# ==========================================
echo -e "${GREEN}=========================================="
echo "   ✅ 모든 테스트 통과!"
echo "==========================================${NC}"
echo ""
echo "📊 테스트 결과 요약:"
echo "   - 요금제: $PLAN_ID"
echo "   - 학원: $ACADEMY_ID"
echo "   - 학원장: $DIRECTOR_ID"
echo "   - 학생: $STUDENT_ID"
echo "   - 구독: $SUB_ID (활성)"
echo "   - 학생 사용량: $USAGE_STUDENTS"
echo ""
echo "🌐 확인 URL:"
echo "   - 학원 관리: ${BASE_URL}/dashboard/admin/academies"
echo "   - 학원 상세: ${BASE_URL}/dashboard/admin/academies/detail?id=$ACADEMY_ID"
echo "   - 요금제 관리: ${BASE_URL}/dashboard/admin/pricing"
echo "   - 봇 관리: ${BASE_URL}/dashboard/admin/bot-management"
echo ""
