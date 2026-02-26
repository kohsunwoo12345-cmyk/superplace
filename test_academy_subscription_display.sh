#!/bin/bash

echo "=================================================="
echo "학원 관리 페이지 - 요금제 표시 테스트"
echo "=================================================="
echo ""

API_BASE="https://superplacestudy.pages.dev/api"

# 관리자 토큰 (실제 환경에서는 로그인 후 받은 토큰 사용)
ADMIN_TOKEN="test-admin-token"

echo "📋 Step 1: 학원 목록 조회 (요금제 정보 포함)"
echo "---------------------------------------------------"
echo "GET $API_BASE/admin/academies"
echo ""

ACADEMIES_RESPONSE=$(curl -s -X GET "$API_BASE/admin/academies" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$ACADEMIES_RESPONSE" | jq '.'
echo ""

# 첫 번째 학원의 구독 정보 추출
FIRST_ACADEMY=$(echo "$ACADEMIES_RESPONSE" | jq -r '.academies[0]')
ACADEMY_ID=$(echo "$FIRST_ACADEMY" | jq -r '.id')
ACADEMY_NAME=$(echo "$FIRST_ACADEMY" | jq -r '.name')
SUBSCRIPTION_PLAN=$(echo "$FIRST_ACADEMY" | jq -r '.subscriptionPlan')

if [ "$ACADEMY_ID" != "null" ] && [ "$ACADEMY_ID" != "" ]; then
  echo "✅ 첫 번째 학원 정보:"
  echo "   ID: $ACADEMY_ID"
  echo "   이름: $ACADEMY_NAME"
  echo "   요금제: $SUBSCRIPTION_PLAN"
  echo ""
  
  # 구독 상세 정보
  CURRENT_PLAN=$(echo "$FIRST_ACADEMY" | jq '.currentPlan')
  if [ "$CURRENT_PLAN" != "null" ]; then
    echo "   📊 구독 상세:"
    echo "$CURRENT_PLAN" | jq '.'
    echo ""
  fi
  
  echo ""
  echo "📋 Step 2: 특정 학원 상세 조회"
  echo "---------------------------------------------------"
  echo "GET $API_BASE/admin/academies?id=$ACADEMY_ID"
  echo ""
  
  ACADEMY_DETAIL=$(curl -s -X GET "$API_BASE/admin/academies?id=$ACADEMY_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json")
  
  echo "Response:"
  echo "$ACADEMY_DETAIL" | jq '.'
  echo ""
  
  # 상세 페이지의 구독 정보
  DETAIL_PLAN=$(echo "$ACADEMY_DETAIL" | jq -r '.academy.subscriptionPlan')
  DETAIL_CURRENT_PLAN=$(echo "$ACADEMY_DETAIL" | jq '.academy.currentPlan')
  
  echo "✅ 상세 페이지 구독 정보:"
  echo "   요금제: $DETAIL_PLAN"
  if [ "$DETAIL_CURRENT_PLAN" != "null" ]; then
    echo "   📊 구독 상세:"
    echo "$DETAIL_CURRENT_PLAN" | jq '.'
  fi
else
  echo "⚠️ 등록된 학원이 없습니다."
fi

echo ""
echo "=================================================="
echo "테스트 완료"
echo "=================================================="
echo ""
echo "✅ 확인 사항:"
echo "   1. 학원 목록에 subscriptionPlan 필드 표시"
echo "   2. 학원 목록에 currentPlan 객체 포함"
echo "   3. currentPlan에 사용량/제한 정보 표시"
echo "   4. 학원 상세 페이지에도 동일한 정보 표시"
echo ""
