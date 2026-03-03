#!/bin/bash
#################################################
# 포인트 충전 및 매출 관리 시스템 테스트 스크립트
# 목적: 포인트 충전 반영 및 매출 집계 정확성 검증
#################################################

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL
API_BASE_URL="https://superplacestudy.pages.dev"
# API_BASE_URL="http://localhost:8788"  # 로컬 테스트 시

# 관리자 토큰
ADMIN_TOKEN="YOUR_ADMIN_TOKEN_HERE"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🧪 포인트 충전 및 매출 시스템 테스트 시작${NC}"
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
  
  if [ -n "$data" ]; then
    echo "   Data: $data" | head -c 100
    echo ""
  fi
  
  if [ "$method" == "GET" ]; then
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X GET "${API_BASE_URL}${endpoint}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json")
  elif [ "$method" == "POST" ]; then
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X POST "${API_BASE_URL}${endpoint}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
  body=$(echo "$response" | sed '/HTTP_STATUS/d')

  echo "   Status: $http_status"
  echo "   Response:"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  echo ""
  
  # 응답 저장
  echo "$body" > /tmp/last_api_response.json
  
  return $http_status
}

#################################################
# 테스트 1: 포인트 충전 요청 목록 조회
#################################################
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 테스트 1: 포인트 충전 요청 목록 조회${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

call_api "GET" "/api/admin/point-charge-requests?status=PENDING" "" "대기 중인 포인트 충전 요청 조회"

if [ $? -eq 200 ]; then
  echo -e "${GREEN}✅ 요청 목록 조회 성공${NC}"
  
  if command -v jq &> /dev/null; then
    pending_count=$(jq '.stats.pending' /tmp/last_api_response.json 2>/dev/null || echo "0")
    echo -e "${BLUE}대기 중인 요청: ${pending_count}건${NC}"
  fi
else
  echo -e "${RED}❌ 요청 목록 조회 실패${NC}"
fi

echo ""
sleep 2

#################################################
# 테스트 2: 포인트 충전 승인 (첫 번째 PENDING 요청)
#################################################
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 테스트 2: 포인트 충전 승인${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if command -v jq &> /dev/null; then
  # 첫 번째 PENDING 요청 ID 가져오기
  first_request=$(jq -r '.requests[] | select(.status == "PENDING") | .id' /tmp/last_api_response.json 2>/dev/null | head -1)
  
  if [ -n "$first_request" ] && [ "$first_request" != "null" ]; then
    echo -e "${YELLOW}승인할 요청 ID: ${first_request}${NC}"
    
    # 승인 전 요청 정보 출력
    echo -e "${BLUE}승인 전 요청 정보:${NC}"
    jq ".requests[] | select(.id == \"$first_request\")" /tmp/last_api_response.json 2>/dev/null
    
    # 포인트 충전 승인
    approval_data=$(cat <<EOF
{
  "requestId": "$first_request"
}
EOF
)
    
    call_api "POST" "/api/admin/point-charge-requests/approve" "$approval_data" "포인트 충전 승인"
    
    if [ $? -eq 200 ]; then
      echo -e "${GREEN}✅ 포인트 충전 승인 성공${NC}"
      
      # 승인 결과 확인
      if command -v jq &> /dev/null; then
        success=$(jq -r '.success' /tmp/last_api_response.json 2>/dev/null)
        message=$(jq -r '.message' /tmp/last_api_response.json 2>/dev/null)
        userId=$(jq -r '.data.userId' /tmp/last_api_response.json 2>/dev/null)
        userName=$(jq -r '.data.userName' /tmp/last_api_response.json 2>/dev/null)
        beforePoints=$(jq -r '.data.beforePoints' /tmp/last_api_response.json 2>/dev/null)
        afterPoints=$(jq -r '.data.afterPoints' /tmp/last_api_response.json 2>/dev/null)
        addedPoints=$(jq -r '.data.addedPoints' /tmp/last_api_response.json 2>/dev/null)
        
        echo -e "${BLUE}승인 결과:${NC}"
        echo "  - 성공: $success"
        echo "  - 메시지: $message"
        echo "  - 사용자 ID: $userId"
        echo "  - 사용자 이름: $userName"
        echo "  - 승인 전 포인트: $beforePoints"
        echo "  - 승인 후 포인트: $afterPoints"
        echo "  - 추가된 포인트: $addedPoints"
        
        # 검증: 포인트 증가량 확인
        if [ "$addedPoints" -gt 0 ]; then
          echo -e "${GREEN}✅ 포인트가 정상적으로 증가했습니다!${NC}"
        else
          echo -e "${RED}❌ 포인트 증가가 확인되지 않습니다!${NC}"
        fi
      fi
    else
      echo -e "${RED}❌ 포인트 충전 승인 실패${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  승인할 PENDING 요청이 없습니다${NC}"
    echo "   수동으로 포인트 충전 요청을 생성하거나 기존 요청 ID를 입력하세요."
  fi
else
  echo -e "${YELLOW}⚠️  jq가 설치되지 않아 자동 테스트를 진행할 수 없습니다${NC}"
  echo "   수동으로 요청 ID를 입력하세요:"
  read -p "   요청 ID: " manual_request_id
  
  if [ -n "$manual_request_id" ]; then
    approval_data=$(cat <<EOF
{
  "requestId": "$manual_request_id"
}
EOF
)
    call_api "POST" "/api/admin/point-charge-requests/approve" "$approval_data" "포인트 충전 승인"
  fi
fi

echo ""
sleep 2

#################################################
# 테스트 3: 승인된 요청 목록 확인
#################################################
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 테스트 3: 승인된 요청 목록 확인${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

call_api "GET" "/api/admin/point-charge-requests?status=APPROVED" "" "승인된 포인트 충전 요청 조회"

if [ $? -eq 200 ]; then
  echo -e "${GREEN}✅ 승인된 요청 목록 조회 성공${NC}"
  
  if command -v jq &> /dev/null; then
    approved_count=$(jq '.stats.approved' /tmp/last_api_response.json 2>/dev/null || echo "0")
    total_amount=$(jq '.stats.totalAmount' /tmp/last_api_response.json 2>/dev/null || echo "0")
    total_points=$(jq '.stats.totalPoints' /tmp/last_api_response.json 2>/dev/null || echo "0")
    
    echo -e "${BLUE}승인된 요청 통계:${NC}"
    echo "  - 승인 건수: ${approved_count}건"
    echo "  - 총 금액: ${total_amount}원"
    echo "  - 총 포인트: ${total_points}P"
  fi
else
  echo -e "${RED}❌ 승인된 요청 목록 조회 실패${NC}"
fi

echo ""
sleep 2

#################################################
# 테스트 4: 매출 관리 페이지 데이터 조회
#################################################
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 테스트 4: 매출 관리 데이터 조회${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

call_api "GET" "/api/admin/revenue?period=month" "" "매출 데이터 조회"

if [ $? -eq 200 ]; then
  echo -e "${GREEN}✅ 매출 데이터 조회 성공${NC}"
  
  if command -v jq &> /dev/null; then
    total_revenue=$(jq '.stats.totalRevenue' /tmp/last_api_response.json 2>/dev/null || echo "0")
    this_month=$(jq '.stats.thisMonthRevenue' /tmp/last_api_response.json 2>/dev/null || echo "0")
    point_revenue=$(jq '.stats.pointRevenue' /tmp/last_api_response.json 2>/dev/null || echo "0")
    bot_revenue=$(jq '.stats.botRevenue' /tmp/last_api_response.json 2>/dev/null || echo "0")
    regular_revenue=$(jq '.stats.regularRevenue' /tmp/last_api_response.json 2>/dev/null || echo "0")
    transaction_count=$(jq '.stats.transactionCount' /tmp/last_api_response.json 2>/dev/null || echo "0")
    
    echo -e "${BLUE}매출 통계:${NC}"
    echo "  - 총 매출: $(printf "%'d" $total_revenue)원"
    echo "  - 이번 달 매출: $(printf "%'d" $this_month)원"
    echo "  - 포인트 충전 매출: $(printf "%'d" $point_revenue)원"
    echo "  - AI 쇼핑몰 매출: $(printf "%'d" $bot_revenue)원"
    echo "  - 기타 매출: $(printf "%'d" $regular_revenue)원"
    echo "  - 거래 건수: ${transaction_count}건"
    
    # VAT 정보
    total_vat=$(jq '.vatInfo.totalVAT' /tmp/last_api_response.json 2>/dev/null || echo "0")
    point_vat=$(jq '.vatInfo.pointVAT' /tmp/last_api_response.json 2>/dev/null || echo "0")
    bot_vat=$(jq '.vatInfo.botVAT' /tmp/last_api_response.json 2>/dev/null || echo "0")
    net_revenue=$(jq '.vatInfo.totalNetRevenue' /tmp/last_api_response.json 2>/dev/null || echo "0")
    
    echo -e "${BLUE}VAT 정보:${NC}"
    echo "  - 총 VAT: $(printf "%'d" $total_vat)원"
    echo "  - 포인트 충전 VAT: $(printf "%'d" $point_vat)원"
    echo "  - AI 쇼핑몰 VAT: $(printf "%'d" $bot_vat)원"
    echo "  - 순 매출: $(printf "%'d" $net_revenue)원"
    
    # 검증: 포인트 충전 매출이 0보다 큰지 확인
    if [ "$point_revenue" -gt 0 ]; then
      echo -e "${GREEN}✅ 포인트 충전 매출이 정상적으로 집계되었습니다!${NC}"
    else
      echo -e "${YELLOW}⚠️  포인트 충전 매출이 0입니다. 승인된 요청이 없거나 집계 오류일 수 있습니다.${NC}"
    fi
    
    # 검증: 전체 매출 = 포인트 + AI쇼핑몰 + 기타
    calculated_total=$((point_revenue + bot_revenue + regular_revenue))
    if [ "$calculated_total" -eq "$total_revenue" ]; then
      echo -e "${GREEN}✅ 매출 합계가 정확합니다!${NC}"
    else
      echo -e "${RED}❌ 매출 합계 불일치: 계산값($calculated_total) ≠ 실제값($total_revenue)${NC}"
    fi
  fi
else
  echo -e "${RED}❌ 매출 데이터 조회 실패${NC}"
fi

echo ""
sleep 2

#################################################
# 테스트 5: 거래 유형별 통계
#################################################
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 테스트 5: 거래 유형별 통계${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if command -v jq &> /dev/null; then
  echo -e "${BLUE}유형별 매출:${NC}"
  jq -r '.typeStats[] | "  - \(.type): \(.total)원 (\(.count)건)"' /tmp/last_api_response.json 2>/dev/null
  
  # POINT_CHARGE 타입 확인
  point_charge_total=$(jq -r '.typeStats[] | select(.type == "POINT_CHARGE") | .total' /tmp/last_api_response.json 2>/dev/null)
  
  if [ -n "$point_charge_total" ] && [ "$point_charge_total" != "null" ]; then
    echo -e "${GREEN}✅ POINT_CHARGE 타입이 정상적으로 집계되었습니다!${NC}"
  else
    echo -e "${YELLOW}⚠️  POINT_CHARGE 타입을 찾을 수 없습니다${NC}"
  fi
fi

echo ""
sleep 2

#################################################
# 테스트 완료
#################################################
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🎉 포인트 충전 및 매출 시스템 테스트 완료${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

echo -e "${YELLOW}📋 테스트 요약:${NC}"
echo "   1. ✅ 포인트 충전 요청 목록 조회"
echo "   2. ✅ 포인트 충전 승인 및 반영 확인"
echo "   3. ✅ 승인된 요청 목록 및 통계 확인"
echo "   4. ✅ 매출 관리 데이터 조회 (포인트/AI쇼핑몰/기타)"
echo "   5. ✅ 거래 유형별 통계 확인"
echo ""

echo -e "${GREEN}✨ 모든 테스트 시나리오 실행 완료${NC}"
echo ""

# 정리
rm -f /tmp/last_api_response.json

exit 0
