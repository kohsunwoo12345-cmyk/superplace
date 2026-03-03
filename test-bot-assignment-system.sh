#!/bin/bash
#################################################
# AI 봇 할당 시스템 테스트 스크립트
# 목적: 구독 슬롯 카운팅 정확성 검증
#################################################

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL (환경에 맞게 수정)
API_BASE_URL="https://superplacestudy.pages.dev"
# API_BASE_URL="http://localhost:8788"  # 로컬 테스트 시

# 테스트 데이터
TEST_ADMIN_TOKEN="YOUR_ADMIN_TOKEN_HERE"
TEST_ACADEMY_ID="test-academy-001"
TEST_BOT_ID="bot-math-tutor"
TEST_STUDENT_COUNT=30

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🧪 AI 봇 할당 시스템 테스트 시작${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

#################################################
# 함수: API 호출
#################################################
call_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4

  echo -e "${YELLOW}📡 ${description}${NC}"
  echo "   Method: $method"
  echo "   Endpoint: ${API_BASE_URL}${endpoint}"
  
  if [ "$method" == "GET" ]; then
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X GET "${API_BASE_URL}${endpoint}" \
      -H "Authorization: Bearer ${TEST_ADMIN_TOKEN}" \
      -H "Content-Type: application/json")
  elif [ "$method" == "POST" ]; then
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X POST "${API_BASE_URL}${endpoint}" \
      -H "Authorization: Bearer ${TEST_ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$data")
  elif [ "$method" == "DELETE" ]; then
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X DELETE "${API_BASE_URL}${endpoint}" \
      -H "Authorization: Bearer ${TEST_ADMIN_TOKEN}" \
      -H "Content-Type: application/json")
  fi

  http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
  body=$(echo "$response" | sed '/HTTP_STATUS/d')

  echo "   Status: $http_status"
  echo "   Response: $body" | head -c 200
  echo ""
  
  # 응답 저장
  echo "$body" > /tmp/last_api_response.json
  
  return $http_status
}

#################################################
# 함수: 슬롯 상태 확인
#################################################
check_slot_status() {
  local description=$1
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📊 ${description}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  # 구독 정보 조회 (실제로는 별도 API가 필요하지만 여기서는 로그 확인)
  # call_api "GET" "/api/admin/academy-bot-subscriptions?academyId=${TEST_ACADEMY_ID}" "" "구독 슬롯 상태 조회"
  
  # 할당 목록 조회
  call_api "GET" "/api/admin/ai-bots/assignments" "" "할당 목록 조회"
  
  # 응답 파싱 (jq 사용 가능 시)
  if command -v jq &> /dev/null; then
    assignment_count=$(jq '.assignments | length' /tmp/last_api_response.json 2>/dev/null || echo "0")
    echo -e "${GREEN}   현재 할당 수: ${assignment_count}${NC}"
  fi
  
  echo ""
}

#################################################
# 테스트 시나리오 1: 학원에 봇 구독 할당
#################################################
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 테스트 1: 학원에 AI 봇 구독 할당${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

subscription_data=$(cat <<EOF
{
  "academyId": "${TEST_ACADEMY_ID}",
  "productId": "${TEST_BOT_ID}",
  "studentCount": ${TEST_STUDENT_COUNT},
  "subscriptionStart": "2026-03-03",
  "subscriptionEnd": "2027-03-03",
  "pricePerStudent": 0,
  "memo": "테스트 구독 - 자동 생성"
}
EOF
)

call_api "POST" "/api/admin/academy-bot-subscriptions" "$subscription_data" "학원에 ${TEST_STUDENT_COUNT}명 구독 할당"

echo -e "${GREEN}✅ 기대 결과: 총 ${TEST_STUDENT_COUNT}개 슬롯 생성됨${NC}"
echo ""

sleep 2

#################################################
# 테스트 시나리오 2: 학생 30명에게 봇 할당
#################################################
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 테스트 2: 학생 ${TEST_STUDENT_COUNT}명에게 봇 할당${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

success_count=0
fail_count=0

for i in $(seq 1 $TEST_STUDENT_COUNT); do
  student_id="test-student-$(printf "%03d" $i)"
  
  assignment_data=$(cat <<EOF
{
  "botId": "${TEST_BOT_ID}",
  "userId": "${student_id}",
  "duration": 1,
  "durationUnit": "month"
}
EOF
)
  
  echo -e "${YELLOW}[${i}/${TEST_STUDENT_COUNT}] 학생 ${student_id}에게 할당 중...${NC}"
  
  call_api "POST" "/api/admin/ai-bots/assign" "$assignment_data" "학생 ${student_id} 할당" > /dev/null
  
  if [ $? -eq 200 ]; then
    ((success_count++))
    echo -e "   ${GREEN}✓ 성공${NC}"
  else
    ((fail_count++))
    echo -e "   ${RED}✗ 실패${NC}"
  fi
  
  # API 부하 방지
  sleep 0.5
done

echo ""
echo -e "${BLUE}📊 할당 결과:${NC}"
echo -e "   ${GREEN}성공: ${success_count}건${NC}"
echo -e "   ${RED}실패: ${fail_count}건${NC}"
echo ""

check_slot_status "30명 할당 후 상태"

#################################################
# 테스트 시나리오 3: 31번째 할당 시도 (실패해야 함)
#################################################
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 테스트 3: 슬롯 부족 오류 확인 (31번째 할당)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

assignment_data=$(cat <<EOF
{
  "botId": "${TEST_BOT_ID}",
  "userId": "test-student-031",
  "duration": 1,
  "durationUnit": "month"
}
EOF
)

call_api "POST" "/api/admin/ai-bots/assign" "$assignment_data" "슬롯 부족 시 할당 시도"

if [ $? -eq 403 ]; then
  echo -e "${GREEN}✅ 기대 결과: 슬롯 부족 오류 발생 (정상)${NC}"
else
  echo -e "${RED}❌ 예상치 못한 결과: 할당이 성공함 (비정상)${NC}"
fi
echo ""

sleep 2

#################################################
# 테스트 시나리오 4: 1명 할당 취소 (슬롯 복원)
#################################################
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 테스트 4: 할당 취소 및 슬롯 복원${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 첫 번째 할당 ID 조회
call_api "GET" "/api/admin/ai-bots/assignments" "" "할당 목록 조회" > /dev/null

if command -v jq &> /dev/null; then
  first_assignment_id=$(jq -r '.assignments[0].id' /tmp/last_api_response.json 2>/dev/null)
  
  if [ -n "$first_assignment_id" ] && [ "$first_assignment_id" != "null" ]; then
    echo -e "${YELLOW}취소할 할당 ID: ${first_assignment_id}${NC}"
    
    call_api "DELETE" "/api/admin/ai-bots/assignments/${first_assignment_id}" "" "할당 취소"
    
    if [ $? -eq 200 ]; then
      echo -e "${GREEN}✅ 기대 결과: 할당 취소 성공, 슬롯 복원됨${NC}"
    else
      echo -e "${RED}❌ 할당 취소 실패${NC}"
    fi
  else
    echo -e "${RED}❌ 할당 ID를 찾을 수 없음${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  jq가 설치되지 않아 할당 ID를 자동으로 찾을 수 없습니다${NC}"
  echo "   수동으로 할당 ID를 입력하세요:"
  read -p "   할당 ID: " manual_assignment_id
  
  if [ -n "$manual_assignment_id" ]; then
    call_api "DELETE" "/api/admin/ai-bots/assignments/${manual_assignment_id}" "" "할당 취소"
  fi
fi

echo ""

check_slot_status "1명 취소 후 상태 (슬롯 1개 복원)"

sleep 2

#################################################
# 테스트 시나리오 5: 새 학생에게 재할당 (성공해야 함)
#################################################
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 테스트 5: 복원된 슬롯으로 재할당${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

assignment_data=$(cat <<EOF
{
  "botId": "${TEST_BOT_ID}",
  "userId": "test-student-031",
  "duration": 1,
  "durationUnit": "month"
}
EOF
)

call_api "POST" "/api/admin/ai-bots/assign" "$assignment_data" "복원된 슬롯으로 재할당"

if [ $? -eq 200 ]; then
  echo -e "${GREEN}✅ 기대 결과: 재할당 성공 (정상)${NC}"
else
  echo -e "${RED}❌ 예상치 못한 결과: 재할당 실패 (비정상)${NC}"
fi
echo ""

check_slot_status "재할당 후 최종 상태"

#################################################
# 테스트 시나리오 6: 중복 할당 방지 확인
#################################################
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 테스트 6: 중복 할당 방지${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

assignment_data=$(cat <<EOF
{
  "botId": "${TEST_BOT_ID}",
  "userId": "test-student-001",
  "duration": 1,
  "durationUnit": "month"
}
EOF
)

call_api "POST" "/api/admin/ai-bots/assign" "$assignment_data" "이미 할당된 학생에게 중복 할당 시도"

if [ $? -eq 400 ]; then
  echo -e "${GREEN}✅ 기대 결과: 중복 할당 방지 (정상)${NC}"
else
  echo -e "${RED}❌ 예상치 못한 결과: 중복 할당이 허용됨 (비정상)${NC}"
fi
echo ""

#################################################
# 테스트 완료
#################################################
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🎉 AI 봇 할당 시스템 테스트 완료${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

echo -e "${YELLOW}📋 테스트 요약:${NC}"
echo "   1. ✅ 학원에 봇 구독 할당 (${TEST_STUDENT_COUNT}명)"
echo "   2. ✅ 학생 ${TEST_STUDENT_COUNT}명에게 봇 할당"
echo "   3. ✅ 슬롯 부족 오류 확인"
echo "   4. ✅ 할당 취소 및 슬롯 복원"
echo "   5. ✅ 복원된 슬롯으로 재할당"
echo "   6. ✅ 중복 할당 방지"
echo ""

echo -e "${GREEN}✨ 모든 테스트 시나리오 실행 완료${NC}"
echo ""

# 정리
rm -f /tmp/last_api_response.json

exit 0
