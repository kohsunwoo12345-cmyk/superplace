#!/bin/bash

echo "========================================="
echo "구독 정보 확인 API 테스트"
echo "========================================="

# 테스트용 학원 ID (실제 데이터베이스에 있는 것으로 가정)
ACADEMY_ID="test-academy-001"

echo ""
echo "1. academyId로 구독 정보 조회"
echo "GET /api/subscription/check?academyId=${ACADEMY_ID}"
echo ""

# API 호출
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/subscription/check?academyId=${ACADEMY_ID}")

echo "응답:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "========================================="
echo "응답 구조 분석:"
echo "========================================="

# JSON 구조 확인
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
  HAS_SUB=$(echo "$RESPONSE" | jq -r '.hasSubscription')
  
  echo "success: $SUCCESS"
  echo "hasSubscription: $HAS_SUB"
  
  if [ "$HAS_SUB" = "true" ]; then
    echo ""
    echo "구독 정보:"
    echo "$RESPONSE" | jq '.subscription'
    
    echo ""
    echo "프론트엔드 접근 경로:"
    echo "- 플랜명: data.subscription.planName"
    echo "- 만료일: data.subscription.endDate"
    echo "- 학생 사용량: data.subscription.usage.students"
    echo "- 학생 한도: data.subscription.limits.maxStudents"
  fi
else
  echo "JSON 파싱 실패 또는 예상치 못한 응답"
fi

echo ""
echo "========================================="
echo "테스트 완료"
echo "========================================="
