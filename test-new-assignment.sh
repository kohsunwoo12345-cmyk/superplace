#!/bin/bash

echo "🧪 새로운 학원에 봇 할당 테스트 (학원장 자동 할당 검증)"
echo "================================================================"

BASE_URL="https://superplacestudy.pages.dev"

# 1. 학원 목록 조회 (academy API 대신 users에서 academyId 추출)
echo "1️⃣ 사용자 데이터에서 학원 정보 조회..."
USERS_DATA=$(curl -s "$BASE_URL/api/admin/users")
FIRST_ACADEMY_ID=$(echo "$USERS_DATA" | jq -r '.users[] | select(.academyId != null and .academyId != "") | .academyId' | head -1)
ACADEMY_NAME=$(echo "$USERS_DATA" | jq -r ".users[] | select(.academyId == \"$FIRST_ACADEMY_ID\") | .academyId" | head -1)

echo "   ✅ 테스트 학원 ID: $FIRST_ACADEMY_ID"

# 2. AI 봇 목록에서 적절한 봇 선택
echo "2️⃣ AI 봇 목록 조회..."
BOTS=$(curl -s "$BASE_URL/api/admin/ai-bots")
TEST_BOT_ID=$(echo "$BOTS" | jq -r '.bots[] | select(.name | test("학습|테스트")) | .id' | head -1)
TEST_BOT_NAME=$(echo "$BOTS" | jq -r ".bots[] | select(.id == \"$TEST_BOT_ID\") | .name")

echo "   ✅ 테스트 봇: $TEST_BOT_NAME ($TEST_BOT_ID)"

# 3. 할당 전 목록 확인
echo ""
echo "3️⃣ 할당 전 상태 확인..."
BEFORE=$(curl -s "$BASE_URL/api/admin/bot-assignments")
BEFORE_TOTAL=$(echo "$BEFORE" | jq -r '.count')
BEFORE_ACADEMY=$(echo "$BEFORE" | jq -r '.academyCount')
BEFORE_DIRECTOR=$(echo "$BEFORE" | jq -r '.directorCount')

echo "   📊 현재 할당: 전체 $BEFORE_TOTAL개 (학원 $BEFORE_ACADEMY개, 학원장 $BEFORE_DIRECTOR개)"

# 4. 새 봇 할당 실행
echo ""
echo "4️⃣ 학원에 봇 할당 중... (학원장 자동 할당 포함)"
ASSIGN_RESULT=$(curl -s -X POST "$BASE_URL/api/admin/bot-assignments" \
  -H "Content-Type: application/json" \
  -d "{
    \"academyId\": \"$FIRST_ACADEMY_ID\",
    \"botId\": \"$TEST_BOT_ID\",
    \"notes\": \"자동 테스트: 학원장 할당 검증\"
  }")

echo "$ASSIGN_RESULT" | jq '.'
SUCCESS=$(echo "$ASSIGN_RESULT" | jq -r '.success')

echo ""
if [ "$SUCCESS" = "true" ]; then
  echo "✅ 할당 성공!"
  
  sleep 2
  
  # 5. 할당 후 검증
  echo ""
  echo "5️⃣ 할당 후 상태 확인..."
  AFTER=$(curl -s "$BASE_URL/api/admin/bot-assignments")
  AFTER_TOTAL=$(echo "$AFTER" | jq -r '.count')
  AFTER_ACADEMY=$(echo "$AFTER" | jq -r '.academyCount')
  AFTER_DIRECTOR=$(echo "$AFTER" | jq -r '.directorCount')
  
  echo "   📊 할당 후: 전체 $AFTER_TOTAL개 (학원 $AFTER_ACADEMY개, 학원장 $AFTER_DIRECTOR개)"
  echo ""
  echo "   📈 증가량:"
  echo "      전체: +$((AFTER_TOTAL - BEFORE_TOTAL))"
  echo "      학원 할당: +$((AFTER_ACADEMY - BEFORE_ACADEMY))"
  echo "      학원장 할당: +$((AFTER_DIRECTOR - BEFORE_DIRECTOR))"
  
  echo ""
  echo "🔍 할당 내역:"
  echo "$AFTER" | jq -r '.assignments[] | "[\(.assignmentType)] \(.academyName || .academyId) → \(.botName) \(if .userName then "(\(.userName))" else "" end)"' | head -10
  
  echo ""
  if [ $AFTER_DIRECTOR -gt $BEFORE_DIRECTOR ]; then
    echo "✅ **학원장 자동 할당 성공!**"
    echo "   학원에 봇을 할당하면 자동으로 해당 학원의 학원장에게도 할당됩니다."
  else
    echo "⚠️ 학원장 할당이 증가하지 않음"
    echo "   원인: 해당 학원에 DIRECTOR role 사용자가 없거나, user_bot_assignments 테이블 스키마 불일치"
  fi
else
  ERROR_MSG=$(echo "$ASSIGN_RESULT" | jq -r '.message')
  echo "❌ 할당 실패: $ERROR_MSG"
fi

echo ""
echo "================================================================"
echo "🔗 관련 페이지:"
echo "   봇 관리: $BASE_URL/dashboard/admin/bot-management/"
echo "================================================================"
