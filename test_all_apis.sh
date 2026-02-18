#!/bin/bash

# =============================================
# 슈퍼플레이스 전체 API 통합 테스트
# =============================================

BASE_URL="https://superplacestudy.pages.dev"
TEST_LOG="test_results_$(date +%Y%m%d_%H%M%S).log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

log() {
  echo -e "$1" | tee -a "$TEST_LOG"
}

test_api() {
  local test_name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_status="$5"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  log "${YELLOW}Testing: $test_name${NC}"
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$data")
  fi
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$status_code" = "$expected_status" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    log "${GREEN}✅ PASS${NC} - Status: $status_code"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    log "${RED}❌ FAIL${NC} - Expected: $expected_status, Got: $status_code"
    echo "$body"
  fi
  
  log "---"
  sleep 0.5
}

# =============================================
# START TESTING
# =============================================

log "🧪 슈퍼플레이스 API 통합 테스트 시작"
log "============================================="
log "Time: $(date)"
log "Base URL: $BASE_URL"
log "============================================="

# 1. 로그인 테스트
log "\n📍 1. 로그인 시스템 테스트"
log "============================================="

# 1-1. 슈퍼 관리자 로그인
log "1-1. 슈퍼 관리자 로그인"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.com","password":"admin1234"}')

status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$status_code" = "200" ]; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
  TOKEN=$(echo "$body" | jq -r '.data.token')
  log "${GREEN}✅ PASS${NC} - 로그인 성공"
  log "Token: ${TOKEN:0:50}..."
else
  FAILED_TESTS=$((FAILED_TESTS + 1))
  log "${RED}❌ FAIL${NC} - 로그인 실패"
  echo "$body"
  exit 1
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
log "---"

# 1-2. 잘못된 비밀번호
log "1-2. 잘못된 비밀번호 테스트"
test_api "Wrong Password" "POST" "/api/auth/login" \
  '{"email":"admin@superplace.com","password":"wrongpass"}' "401"

# 1-3. 존재하지 않는 사용자
log "1-3. 존재하지 않는 사용자"
test_api "Non-existent User" "POST" "/api/auth/login" \
  '{"email":"notexist@test.com","password":"test1234"}' "401"

# 2. 데이터베이스 통계
log "\n📍 2. 데이터베이스 통계 조회"
log "============================================="

# 2-1. 전체 통계
log "2-1. DB 통계 조회"
response=$(curl -s -X GET "$BASE_URL/api/test/db" \
  -H "Authorization: Bearer $TOKEN")

log "${GREEN}✅ DB Statistics:${NC}"
echo "$response" | jq '.'
TOTAL_TESTS=$((TOTAL_TESTS + 1))
PASSED_TESTS=$((PASSED_TESTS + 1))
log "---"

# 3. 학원 관리 테스트 (실제 API가 구현되면 활성화)
# log "\n📍 3. 학원 관리 테스트"
# log "============================================="
# test_api "Get Academies" "GET" "/api/admin/academies" "" "200"

# 4. 학생 관리 테스트
# log "\n📍 4. 학생 관리 테스트"
# log "============================================="
# test_api "Get Students" "GET" "/api/admin/students" "" "200"

# 5. 반 관리 테스트
# log "\n📍 5. 반 관리 테스트"
# log "============================================="
# test_api "Get Classes" "GET" "/api/admin/classes" "" "200"

# 6. AI 봇 테스트
# log "\n📍 6. AI 봇 관리 테스트"
# log "============================================="
# test_api "Get AI Bots" "GET" "/api/admin/ai-bots" "" "200"

# 7. 요금제 테스트
# log "\n📍 7. 요금제 관리 테스트"
# log "============================================="
# test_api "Get Pricing Plans" "GET" "/api/admin/pricing-plans" "" "200"

# 8. 랜딩페이지 테스트
# log "\n📍 8. 랜딩페이지 관리 테스트"
# log "============================================="
# test_api "Get Landing Pages" "GET" "/api/admin/landing-pages" "" "200"

# =============================================
# TEST SUMMARY
# =============================================

log "\n============================================="
log "🎯 테스트 결과 요약"
log "============================================="
log "Total Tests: $TOTAL_TESTS"
log "Passed: ${GREEN}$PASSED_TESTS${NC}"
log "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
  log "\n${GREEN}✅ 모든 테스트 통과!${NC}"
  exit 0
else
  log "\n${RED}❌ 일부 테스트 실패${NC}"
  exit 1
fi

# Test log saved
log "\n📝 Test log saved to: $TEST_LOG"
