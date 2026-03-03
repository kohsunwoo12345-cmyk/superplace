#!/bin/bash

echo "========================================="
echo "학원장 academyId 마이그레이션 실행"
echo "========================================="

BASE_URL="https://superplacestudy.pages.dev"

echo ""
echo "🔧 마이그레이션 API 호출 중..."
echo "GET ${BASE_URL}/api/admin/fix-director-academy"
echo ""

RESPONSE=$(curl -s "${BASE_URL}/api/admin/fix-director-academy")

echo "📊 마이그레이션 결과:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# 결과 요약
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
  
  if [ "$SUCCESS" = "true" ]; then
    echo ""
    echo "========================================="
    echo "✅ 마이그레이션 성공"
    echo "========================================="
    
    TOTAL=$(echo "$RESPONSE" | jq -r '.totalProcessed // 0')
    SUCCESS_COUNT=$(echo "$RESPONSE" | jq -r '.successCount // 0')
    FAIL_COUNT=$(echo "$RESPONSE" | jq -r '.failCount // 0')
    
    echo "총 처리: ${TOTAL}명"
    echo "성공: ${SUCCESS_COUNT}명"
    echo "실패: ${FAIL_COUNT}명"
    
    if [ "$TOTAL" -gt 0 ]; then
      echo ""
      echo "📋 세부 내역:"
      echo "$RESPONSE" | jq -r '.details[]? | "- \(.userName) (\(.userEmail)): \(.academyCode // "N/A") - \(.status)"'
    fi
  else
    echo ""
    echo "⚠️ 마이그레이션 완료되었으나 결과 확인 필요"
  fi
else
  echo ""
  echo "❌ 마이그레이션 실패 또는 예상치 못한 응답"
fi

echo ""
echo "========================================="
echo "다음 단계"
echo "========================================="
cat << 'NEXT'

1. 마이그레이션된 학원장 계정으로 로그인
   - 로그아웃 후 재로그인 필요 (localStorage 갱신)

2. 설정 페이지 확인
   - /dashboard/settings 접속
   - "현재 플랜" 카드에 구독 정보 표시 확인

3. 구독 신청
   - 아직 구독이 없다면 "요금제 선택하기" 클릭
   - 관리자 페이지에서 승인 필요

4. 학생 추가 테스트
   - 구독 승인 후 학생 추가 기능 테스트

NEXT

echo ""
