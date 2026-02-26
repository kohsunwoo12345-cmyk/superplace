#!/bin/bash

echo "=================================================="
echo "🧪 AI 쇼핑몰 구매부터 봇 할당까지 전체 플로우 테스트"
echo "=================================================="
echo ""

BASE_URL="https://superplacestudy.pages.dev"

# Step 0: 마이그레이션 실행
echo "Step 0: 마이그레이션 실행..."
MIGRATION_RESPONSE=$(curl -s "${BASE_URL}/api/admin/run-store-features-migration")
echo "$MIGRATION_RESPONSE" | jq -r '.message' || echo "$MIGRATION_RESPONSE"
echo ""

# Step 1: 제품 목록 조회
echo "Step 1: 제품 목록 조회..."
PRODUCTS=$(curl -s "${BASE_URL}/api/admin/store-products?activeOnly=true")
PRODUCT_COUNT=$(echo "$PRODUCTS" | jq -r '.products | length')
echo "   ✅ 총 $PRODUCT_COUNT 개 제품 발견"

if [ "$PRODUCT_COUNT" -eq "0" ]; then
    echo "   ⚠️  제품이 없습니다. 테스트를 종료합니다."
    exit 1
fi

PRODUCT_ID=$(echo "$PRODUCTS" | jq -r '.products[0].id')
PRODUCT_NAME=$(echo "$PRODUCTS" | jq -r '.products[0].name')
PRICE_PER_STUDENT=$(echo "$PRODUCTS" | jq -r '.products[0].pricePerStudent')

echo "   테스트 제품: $PRODUCT_NAME"
echo "   제품 ID: $PRODUCT_ID"
echo "   학생당 가격: $PRICE_PER_STUDENT 원"
echo ""

# Step 2: 사용자 로그인 (테스트 계정 필요)
echo "Step 2: 사용자 인증..."
echo "   ⚠️  실제 테스트를 위해서는 유효한 사용자 토큰이 필요합니다."
echo "   테스트 계정으로 로그인해서 토큰을 얻어야 합니다."
echo ""

# 테스트용 토큰 (실제 환경에서는 로그인 API로 얻어야 함)
# TOKEN="USER_ID|USER_EMAIL|DIRECTOR|ACADEMY_ID"
# echo "   토큰: $TOKEN"
echo "   ⏸️  토큰이 필요하므로 여기서 일시 중지합니다."
echo ""

# Step 3: 구매 신청 생성
echo "Step 3: 구매 신청 생성 (API 테스트)..."
echo "   API Endpoint: POST /api/bot-purchase-requests/create"
echo "   필수 파라미터:"
echo "     - productId: $PRODUCT_ID"
echo "     - productName: $PRODUCT_NAME"
echo "     - studentCount: 5"
echo "     - months: 1"
echo "     - pricePerStudent: $PRICE_PER_STUDENT"
echo "     - totalPrice: $(( 5 * 1 * ${PRICE_PER_STUDENT:-5000} ))"
echo "     - depositBank: 국민은행"
echo "     - depositorName: 테스터"
echo ""
echo "   ⚠️  실제 구매 신청을 하려면 위 정보로 API를 호출하세요."
echo ""

# Step 4: 관리자 승인
echo "Step 4: 관리자 승인 프로세스..."
echo "   관리자는 다음 단계를 수행해야 합니다:"
echo "   1. /dashboard/admin/bot-shop-approvals 페이지 접속"
echo "   2. 대기 중인 구매 신청 확인"
echo "   3. '승인' 버튼 클릭"
echo ""
echo "   또는 API로 승인:"
echo "   POST /api/admin/bot-purchase-requests/approve"
echo "   Body: { \"requestId\": \"bpr_xxx\" }"
echo ""

# Step 5: 구독 정보 생성 확인
echo "Step 5: 구독 정보 생성 확인..."
echo "   승인 시 생성되는 항목:"
echo "   - BotPurchaseRequest.status → APPROVED"
echo "   - AcademyBotSubscription 레코드 생성 또는 업데이트"
echo "     * totalStudentSlots: 구매한 학생 수"
echo "     * usedStudentSlots: 0"
echo "     * remainingStudentSlots: 구매한 학생 수"
echo "     * subscriptionEnd: 현재 + N개월"
echo ""

# Step 6: 봇 할당 확인
echo "Step 6: 봇 할당 확인..."
echo "   확인해야 할 사항:"
echo "   1. AcademyBotSubscription 테이블에 해당 학원의 구독이 있는가?"
echo "   2. productId가 봇 ID와 매칭되는가?"
echo "   3. 학원장이 해당 봇에 접근할 수 있는가?"
echo "   4. 학생을 등록할 때 슬롯이 정상적으로 차감되는가?"
echo ""

# Step 7: 학생 등록 테스트
echo "Step 7: 학생 등록 테스트..."
echo "   학생을 등록할 때:"
echo "   1. AcademyBotSubscription.remainingStudentSlots > 0 확인"
echo "   2. 학생 등록 성공"
echo "   3. usedStudentSlots += 1"
echo "   4. remainingStudentSlots -= 1"
echo ""

# Step 8: 실제 봇 접근 테스트
echo "Step 8: 실제 봇 접근 테스트..."
echo "   학원장이 다음을 확인해야 합니다:"
echo "   1. /dashboard 페이지에서 구매한 봇이 보이는가?"
echo "   2. 봇 상세 페이지 접근 가능한가?"
echo "   3. 봇과 대화할 수 있는가?"
echo "   4. 학생 등록이 정상적으로 작동하는가?"
echo ""

# Summary
echo "=================================================="
echo "📊 테스트 체크리스트"
echo "=================================================="
echo ""
echo "기본 설정:"
echo "  [ ] 1. 제품이 StoreProducts 테이블에 등록되어 있음"
echo "  [ ] 2. 제품의 pricePerStudent > 0"
echo "  [ ] 3. 제품의 botId가 유효한 봇 ID"
echo ""
echo "구매 프로세스:"
echo "  [ ] 4. 사용자가 상세 페이지에서 '구매하기' 클릭"
echo "  [ ] 5. 구매 다이얼로그에서 학생 수, 개월 수 입력"
echo "  [ ] 6. 입금 정보 입력 후 '구매 신청' 버튼 클릭"
echo "  [ ] 7. BotPurchaseRequest 레코드 생성 (status=PENDING)"
echo ""
echo "승인 프로세스:"
echo "  [ ] 8. 관리자가 승인 페이지에서 요청 확인"
echo "  [ ] 9. '승인' 버튼 클릭"
echo "  [ ] 10. BotPurchaseRequest.status → APPROVED"
echo "  [ ] 11. AcademyBotSubscription 생성/업데이트"
echo ""
echo "봇 할당:"
echo "  [ ] 12. 학원장 대시보드에 봇이 표시됨"
echo "  [ ] 13. 봇 상세 페이지 접근 가능"
echo "  [ ] 14. 봇과 대화 가능"
echo "  [ ] 15. 학생 등록 시 슬롯 차감"
echo ""
echo "=================================================="
echo "🔍 수동 테스트 필요"
echo "=================================================="
echo ""
echo "다음 단계를 직접 수행해주세요:"
echo ""
echo "1. 브라우저에서 로그인:"
echo "   https://superplacestudy.pages.dev/login"
echo ""
echo "2. 쇼핑몰 페이지 방문:"
echo "   https://superplacestudy.pages.dev/store"
echo ""
echo "3. 제품 선택 후 '자세히보기' 클릭"
echo ""
echo "4. 상세 페이지에서 '구매하기' 클릭"
echo ""
echo "5. 구매 정보 입력 후 신청"
echo ""
echo "6. 관리자 계정으로 승인:"
echo "   https://superplacestudy.pages.dev/dashboard/admin/bot-shop-approvals"
echo ""
echo "7. 학원장 대시보드에서 봇 확인:"
echo "   https://superplacestudy.pages.dev/dashboard"
echo ""
echo "8. 봇 접근 및 학생 등록 테스트"
echo ""
echo "=================================================="
echo ""

# API 엔드포인트 정리
echo "📡 주요 API 엔드포인트:"
echo ""
echo "제품 관련:"
echo "  GET  /api/admin/store-products?activeOnly=true"
echo ""
echo "구매 관련:"
echo "  POST /api/bot-purchase-requests/create"
echo "  GET  /api/bot-purchase-requests (사용자 자신의 요청 목록)"
echo ""
echo "관리자:"
echo "  GET  /api/admin/bot-purchase-requests/list"
echo "  POST /api/admin/bot-purchase-requests/approve"
echo "  POST /api/admin/bot-purchase-requests/reject"
echo ""
echo "구독 확인:"
echo "  GET  /api/academies/subscriptions (구독 정보 조회)"
echo ""
echo "=================================================="
