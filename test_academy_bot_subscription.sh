#!/bin/bash

echo "=========================================="
echo "🧪 학원 AI 봇 구독 할당 테스트"
echo "=========================================="
echo ""

# 테스트 변수
API_URL="https://superplacestudy.pages.dev"
TOKEN="admin-001|admin@superplace.com|SUPER_ADMIN"

# 현재 날짜와 1개월 후 날짜 계산
START_DATE=$(date +%Y-%m-%d)
END_DATE=$(date -d "+1 month" +%Y-%m-%d)

echo "📅 테스트 기간:"
echo "   시작일: $START_DATE"
echo "   종료일: $END_DATE"
echo ""

# 1. 학원 목록 조회
echo "1️⃣ 학원 목록 조회 중..."
ACADEMIES=$(curl -s "$API_URL/api/admin/academies" \
  -H "Authorization: Bearer $TOKEN")

echo "학원 목록:"
echo "$ACADEMIES" | jq -r '.academies[] | "  - \(.id): \(.name) (\(.code))"' 2>/dev/null || echo "$ACADEMIES"
echo ""

# 첫 번째 학원 ID 추출
ACADEMY_ID=$(echo "$ACADEMIES" | jq -r '.academies[0].id' 2>/dev/null)
ACADEMY_NAME=$(echo "$ACADEMIES" | jq -r '.academies[0].name' 2>/dev/null)

if [ -z "$ACADEMY_ID" ] || [ "$ACADEMY_ID" = "null" ]; then
  echo "❌ 학원을 찾을 수 없습니다."
  exit 1
fi

echo "✅ 선택된 학원: $ACADEMY_NAME (ID: $ACADEMY_ID)"
echo ""

# 2. AI 봇 목록 조회
echo "2️⃣ AI 봇 목록 조회 중..."
BOTS=$(curl -s "$API_URL/api/admin/ai-bots" \
  -H "Authorization: Bearer $TOKEN")

echo "AI 봇 목록:"
echo "$BOTS" | jq -r '.bots[] | "  - \(.id): \(.name)"' 2>/dev/null || echo "$BOTS"
echo ""

# 첫 번째 활성 봇 ID 추출
BOT_ID=$(echo "$BOTS" | jq -r '.bots[] | select(.isActive == true) | .id' 2>/dev/null | head -1)
BOT_NAME=$(echo "$BOTS" | jq -r '.bots[] | select(.isActive == true) | .name' 2>/dev/null | head -1)

if [ -z "$BOT_ID" ] || [ "$BOT_ID" = "null" ]; then
  echo "❌ 활성화된 AI 봇을 찾을 수 없습니다."
  exit 1
fi

echo "✅ 선택된 봇: $BOT_NAME (ID: $BOT_ID)"
echo ""

# 3. 학원에 봇 구독 할당
echo "3️⃣ 학원에 AI 봇 구독 할당 중..."
echo "   학원: $ACADEMY_NAME"
echo "   봇: $BOT_NAME"
echo "   학생 수 제한: 5명"
echo "   기간: $START_DATE ~ $END_DATE"
echo "   가격: 무료"
echo ""

ASSIGN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_URL/api/admin/academy-bot-subscriptions" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"academyId\": \"$ACADEMY_ID\",
    \"productId\": \"$BOT_ID\",
    \"studentCount\": 5,
    \"subscriptionStart\": \"$START_DATE\",
    \"subscriptionEnd\": \"$END_DATE\",
    \"pricePerStudent\": 0,
    \"memo\": \"테스트 할당 - 5명 제한\"
  }")

HTTP_STATUS=$(echo "$ASSIGN_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$ASSIGN_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "HTTP 상태 코드: $HTTP_STATUS"
echo "응답:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ 학원에 봇 구독 할당 성공!"
  
  # 구독 ID 추출
  SUB_ID=$(echo "$RESPONSE_BODY" | jq -r '.subscription.id' 2>/dev/null)
  TOTAL_SLOTS=$(echo "$RESPONSE_BODY" | jq -r '.subscription.totalStudentSlots' 2>/dev/null)
  REMAINING_SLOTS=$(echo "$RESPONSE_BODY" | jq -r '.subscription.remainingStudentSlots' 2>/dev/null)
  
  echo ""
  echo "📊 구독 정보:"
  echo "   - 구독 ID: $SUB_ID"
  echo "   - 전체 슬롯: $TOTAL_SLOTS명"
  echo "   - 남은 슬롯: $REMAINING_SLOTS명"
  echo "   - 사용 슬롯: 0명"
else
  echo "❌ 학원에 봇 구독 할당 실패!"
  echo "   상태 코드: $HTTP_STATUS"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ 모든 테스트 완료!"
echo "=========================================="
echo ""
echo "📝 다음 단계:"
echo "1. 브라우저에서 https://superplacestudy.pages.dev/login 접속"
echo "2. SUPER_ADMIN으로 로그인"
echo "3. 좌측 메뉴 → AI 봇 관리"
echo "4. \"학원에 구독 할당\" 버튼 클릭"
echo "5. 학원, 봇, 학생 수, 기간 입력 후 할당"
echo "6. 학생에게 봇 할당 시도 (5명까지 성공, 6번째는 실패해야 함)"
echo ""
