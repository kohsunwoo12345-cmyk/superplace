#!/bin/bash

# 학원 봇 할당 시 학원장 자동 할당 테스트 스크립트

echo "================================"
echo "🧪 AI 봇 학원장 자동 할당 테스트"
echo "================================"
echo ""

BASE_URL="https://superplacestudy.pages.dev"

# 1. 학원 목록 조회
echo "1️⃣ 학원 목록 조회..."
ACADEMIES=$(curl -s "$BASE_URL/api/admin/academies")
echo "$ACADEMIES" | jq -r '.academies[:3] | .[] | "   \(.id): \(.name)"'
FIRST_ACADEMY_ID=$(echo "$ACADEMIES" | jq -r '.academies[0].id')
echo "   ✅ 테스트 학원 ID: $FIRST_ACADEMY_ID"
echo ""

# 2. AI 봇 목록 조회
echo "2️⃣ AI 봇 목록 조회..."
BOTS=$(curl -s "$BASE_URL/api/admin/ai-bots")
echo "$BOTS" | jq -r '.bots[:3] | .[] | "   \(.id): \(.name)"'
FIRST_BOT_ID=$(echo "$BOTS" | jq -r '.bots[0].id')
echo "   ✅ 테스트 봇 ID: $FIRST_BOT_ID"
echo ""

# 3. 할당 전 상태 확인
echo "3️⃣ 할당 전 목록 확인..."
BEFORE_ASSIGNMENTS=$(curl -s "$BASE_URL/api/admin/bot-assignments")
BEFORE_COUNT=$(echo "$BEFORE_ASSIGNMENTS" | jq -r '.count')
echo "   📊 현재 할당 개수: $BEFORE_COUNT"
echo ""

# 4. 학원에 봇 할당 (학원장 자동 할당 트리거)
echo "4️⃣ 학원에 봇 할당 중... (학원장 자동 할당 포함)"
ASSIGN_RESULT=$(curl -s -X POST "$BASE_URL/api/admin/bot-assignments" \
  -H "Content-Type: application/json" \
  -d "{
    \"academyId\": \"$FIRST_ACADEMY_ID\",
    \"botId\": \"$FIRST_BOT_ID\",
    \"notes\": \"테스트: 학원장 자동 할당 검증\"
  }")

echo "$ASSIGN_RESULT" | jq '.'
SUCCESS=$(echo "$ASSIGN_RESULT" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo "   ✅ 할당 성공!"
  echo ""
  
  # 5. 할당 후 상태 확인
  echo "5️⃣ 할당 후 목록 확인..."
  sleep 2
  AFTER_ASSIGNMENTS=$(curl -s "$BASE_URL/api/admin/bot-assignments")
  
  echo ""
  echo "📋 전체 할당 목록:"
  echo "$AFTER_ASSIGNMENTS" | jq -r '.assignments[] | "   [\(.assignmentType)] \(.academyName) → \(.botName) \(if .userName then "(\(.userName))" else "" end)"' | head -10
  
  AFTER_COUNT=$(echo "$AFTER_ASSIGNMENTS" | jq -r '.count')
  ACADEMY_COUNT=$(echo "$AFTER_ASSIGNMENTS" | jq -r '.academyAssignments | length')
  DIRECTOR_COUNT=$(echo "$AFTER_ASSIGNMENTS" | jq -r '.directorAssignments | length')
  
  echo ""
  echo "📊 할당 통계:"
  echo "   전체 할당: $BEFORE_COUNT → $AFTER_COUNT (증가: $((AFTER_COUNT - BEFORE_COUNT)))"
  echo "   🏫 학원 할당: $ACADEMY_COUNT개"
  echo "   👤 학원장 할당: $DIRECTOR_COUNT개"
  
  echo ""
  echo "✅ 자동 할당 검증:"
  if [ $DIRECTOR_COUNT -gt 0 ]; then
    echo "   ✅ 학원장 자동 할당 성공!"
    echo "   📌 학원에 봇을 할당하면 자동으로 해당 학원의 학원장에게도 할당됩니다."
  else
    echo "   ⚠️ 학원장 할당이 확인되지 않음 (학원에 학원장이 없을 수 있음)"
  fi
  
else
  echo "   ❌ 할당 실패: $(echo "$ASSIGN_RESULT" | jq -r '.message')"
fi

echo ""
echo "================================"
echo "🔗 관련 링크:"
echo "   봇 관리: $BASE_URL/dashboard/admin/bot-management/"
echo "   학원 목록: $BASE_URL/dashboard/admin/academies"
echo "   AI 봇 목록: $BASE_URL/dashboard/admin/ai-bots"
echo "================================"
