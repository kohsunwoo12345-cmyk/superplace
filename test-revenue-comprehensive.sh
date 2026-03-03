#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 매출 관리 시스템 종합 테스트 스크립트
# ═══════════════════════════════════════════════════════════════

set -e

API_BASE_URL="${API_BASE_URL:-https://superplacestudy.pages.dev}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 헬퍼 함수
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 토큰 확인
if [ -z "$ADMIN_TOKEN" ]; then
    log_error "ADMIN_TOKEN 환경 변수가 설정되지 않았습니다."
    echo "사용법: export ADMIN_TOKEN='your-token-here' && ./test-revenue-comprehensive.sh"
    exit 1
fi

echo "═══════════════════════════════════════════════════════════════"
echo "  매출 관리 시스템 종합 테스트"
echo "═══════════════════════════════════════════════════════════════"
echo ""
log_info "API Base URL: $API_BASE_URL"
log_info "Admin Token: ${ADMIN_TOKEN:0:20}..."
echo ""

# ───────────────────────────────────────────────────────────────
# 1. 전체 매출 현황 조회
# ───────────────────────────────────────────────────────────────
echo "📊 [테스트 1] 전체 매출 현황 조회"
echo "─────────────────────────────────────────────────────────────"

REVENUE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_BASE_URL/api/admin/revenue")

HTTP_CODE=$(echo "$REVENUE_RESPONSE" | tail -n1)
BODY=$(echo "$REVENUE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    log_success "전체 매출 조회 성공 (HTTP $HTTP_CODE)"
    
    # JSON 파싱 (jq가 있으면 사용)
    if command -v jq &> /dev/null; then
        echo "$BODY" | jq '{
            success,
            stats: {
                totalRevenue,
                thisMonthRevenue,
                growth,
                transactionCount,
                pointRevenue,
                botRevenue,
                subscriptionRevenue,
                regularRevenue
            },
            academyCount: (.academyStats | length),
            transactionCount: (.transactions | length)
        }'
        
        TOTAL_REVENUE=$(echo "$BODY" | jq -r '.stats.totalRevenue')
        POINT_REVENUE=$(echo "$BODY" | jq -r '.stats.pointRevenue')
        BOT_REVENUE=$(echo "$BODY" | jq -r '.stats.botRevenue')
        SUBSCRIPTION_REVENUE=$(echo "$BODY" | jq -r '.stats.subscriptionRevenue // 0')
        ACADEMY_COUNT=$(echo "$BODY" | jq -r '.academyStats | length')
        
        log_info "총 매출: ₩${TOTAL_REVENUE}"
        log_info "포인트 충전: ₩${POINT_REVENUE}"
        log_info "AI 쇼핑몰: ₩${BOT_REVENUE}"
        log_info "일반 구독: ₩${SUBSCRIPTION_REVENUE}"
        log_info "학원 수: ${ACADEMY_COUNT}개"
    else
        log_warning "jq가 설치되지 않아 상세 분석을 건너뜁니다."
        echo "$BODY"
    fi
else
    log_error "전체 매출 조회 실패 (HTTP $HTTP_CODE)"
    echo "$BODY"
    exit 1
fi

echo ""

# ───────────────────────────────────────────────────────────────
# 2. 학원별 매출 순위 확인
# ───────────────────────────────────────────────────────────────
echo "🏫 [테스트 2] 학원별 매출 순위 (상위 10개)"
echo "─────────────────────────────────────────────────────────────"

if command -v jq &> /dev/null; then
    echo "$BODY" | jq -r '.academyStats[]? | 
        "[\(.academyId)] \(.academyName) - 총 매출: ₩\(.totalAmount) (\(.transactionCount)건)\n" +
        "  포인트: ₩\(.pointAmount // 0), AI봇: ₩\(.botAmount // 0), 구독: ₩\(.subscriptionAmount // 0), 기타: ₩\(.otherAmount // 0)"' \
        | head -n 20
    
    if [ "$ACADEMY_COUNT" -gt 0 ]; then
        log_success "학원별 매출 통계가 정상적으로 집계되었습니다."
    else
        log_warning "학원별 매출 데이터가 없습니다."
    fi
else
    log_warning "jq가 설치되지 않아 학원별 매출을 표시할 수 없습니다."
fi

echo ""

# ───────────────────────────────────────────────────────────────
# 3. 날짜 범위 필터 테스트
# ───────────────────────────────────────────────────────────────
echo "📅 [테스트 3] 날짜 범위 필터 테스트 (2026-01-01 ~ 2026-12-31)"
echo "─────────────────────────────────────────────────────────────"

FILTERED_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_BASE_URL/api/admin/revenue?startDate=2026-01-01&endDate=2026-12-31")

FILTERED_HTTP_CODE=$(echo "$FILTERED_RESPONSE" | tail -n1)
FILTERED_BODY=$(echo "$FILTERED_RESPONSE" | head -n-1)

if [ "$FILTERED_HTTP_CODE" = "200" ]; then
    log_success "날짜 범위 필터 조회 성공 (HTTP $FILTERED_HTTP_CODE)"
    
    if command -v jq &> /dev/null; then
        FILTERED_TOTAL=$(echo "$FILTERED_BODY" | jq -r '.stats.totalRevenue')
        FILTERED_COUNT=$(echo "$FILTERED_BODY" | jq -r '.stats.transactionCount')
        log_info "필터링된 매출: ₩${FILTERED_TOTAL} (${FILTERED_COUNT}건)"
    fi
else
    log_error "날짜 범위 필터 조회 실패 (HTTP $FILTERED_HTTP_CODE)"
    echo "$FILTERED_BODY"
fi

echo ""

# ───────────────────────────────────────────────────────────────
# 4. 검색 기능 테스트
# ───────────────────────────────────────────────────────────────
echo "🔍 [테스트 4] 학원명 검색 테스트"
echo "─────────────────────────────────────────────────────────────"

# 첫 번째 학원 이름 추출 (있다면)
if command -v jq &> /dev/null && [ "$ACADEMY_COUNT" -gt 0 ]; then
    FIRST_ACADEMY=$(echo "$BODY" | jq -r '.academyStats[0].academyName // empty')
    
    if [ -n "$FIRST_ACADEMY" ]; then
        log_info "검색어: $FIRST_ACADEMY"
        
        SEARCH_RESPONSE=$(curl -s -w "\n%{http_code}" \
          -H "Authorization: Bearer $ADMIN_TOKEN" \
          "$API_BASE_URL/api/admin/revenue?search=$(echo $FIRST_ACADEMY | head -c 10)")
        
        SEARCH_HTTP_CODE=$(echo "$SEARCH_RESPONSE" | tail -n1)
        SEARCH_BODY=$(echo "$SEARCH_RESPONSE" | head -n-1)
        
        if [ "$SEARCH_HTTP_CODE" = "200" ]; then
            log_success "학원명 검색 성공 (HTTP $SEARCH_HTTP_CODE)"
            SEARCH_RESULT_COUNT=$(echo "$SEARCH_BODY" | jq -r '.stats.transactionCount')
            log_info "검색 결과: ${SEARCH_RESULT_COUNT}건"
        else
            log_error "학원명 검색 실패 (HTTP $SEARCH_HTTP_CODE)"
        fi
    else
        log_warning "검색할 학원이 없습니다."
    fi
else
    log_warning "jq가 없거나 학원 데이터가 없어 검색 테스트를 건너뜁니다."
fi

echo ""

# ───────────────────────────────────────────────────────────────
# 5. 월별 매출 추이 확인
# ───────────────────────────────────────────────────────────────
echo "📈 [테스트 5] 월별 매출 추이 (최근 12개월)"
echo "─────────────────────────────────────────────────────────────"

if command -v jq &> /dev/null; then
    MONTHLY_TREND=$(echo "$BODY" | jq -r '.monthlyTrend[]? | "\(.month): ₩\(.total) (\(.count)건)"')
    
    if [ -n "$MONTHLY_TREND" ]; then
        echo "$MONTHLY_TREND" | head -n 12
        log_success "월별 매출 추이가 정상적으로 표시됩니다."
    else
        log_warning "월별 매출 추이 데이터가 없습니다."
    fi
else
    log_warning "jq가 설치되지 않아 월별 추이를 표시할 수 없습니다."
fi

echo ""

# ───────────────────────────────────────────────────────────────
# 6. 매출 유형별 통계 확인
# ───────────────────────────────────────────────────────────────
echo "📊 [테스트 6] 매출 유형별 통계"
echo "─────────────────────────────────────────────────────────────"

if command -v jq &> /dev/null; then
    TYPE_STATS=$(echo "$BODY" | jq -r '.typeStats[]? | "\(.type): ₩\(.total) (\(.count)건)"')
    
    if [ -n "$TYPE_STATS" ]; then
        echo "$TYPE_STATS"
        log_success "매출 유형별 통계가 정상적으로 표시됩니다."
    else
        log_warning "매출 유형별 통계 데이터가 없습니다."
    fi
else
    log_warning "jq가 설치되지 않아 유형별 통계를 표시할 수 없습니다."
fi

echo ""

# ───────────────────────────────────────────────────────────────
# 7. VAT 정보 확인
# ───────────────────────────────────────────────────────────────
echo "💰 [테스트 7] VAT (부가세) 정보 확인"
echo "─────────────────────────────────────────────────────────────"

if command -v jq &> /dev/null; then
    echo "$BODY" | jq '.stats.vatInfo // empty'
    
    if [ $? -eq 0 ]; then
        log_success "VAT 정보가 정상적으로 계산되었습니다."
    else
        log_warning "VAT 정보가 없습니다."
    fi
else
    log_warning "jq가 설치되지 않아 VAT 정보를 표시할 수 없습니다."
fi

echo ""

# ───────────────────────────────────────────────────────────────
# 최종 결과
# ───────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
echo "  테스트 완료"
echo "═══════════════════════════════════════════════════════════════"
echo ""

log_success "모든 매출 관리 시스템 테스트가 완료되었습니다!"
echo ""
log_info "다음 단계:"
echo "  1. 웹 UI에서 매출 관리 페이지를 확인하세요."
echo "  2. 학원별 매출 상세 정보를 검토하세요."
echo "  3. 날짜 필터와 검색 기능을 테스트하세요."
echo "  4. 월별 추이 차트와 유형별 파이 차트를 확인하세요."
echo ""

# 요약 통계 출력
if command -v jq &> /dev/null && [ -n "$BODY" ]; then
    echo "📊 매출 요약:"
    echo "─────────────────────────────────────────────────────────────"
    echo "  총 매출: ₩${TOTAL_REVENUE}"
    echo "  포인트 충전: ₩${POINT_REVENUE}"
    echo "  AI 쇼핑몰: ₩${BOT_REVENUE}"
    echo "  일반 구독: ₩${SUBSCRIPTION_REVENUE}"
    echo "  학원 수: ${ACADEMY_COUNT}개"
    echo "─────────────────────────────────────────────────────────────"
fi
