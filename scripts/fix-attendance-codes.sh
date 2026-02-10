#!/bin/bash

# 출석 코드 문제 해결 스크립트
# 이 스크립트는 배포 후 실행하여 모든 학생에게 출석 코드를 생성합니다.

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🔧 출석 코드 문제 해결 시작..."
echo ""

# 1. 출석 코드 생성/활성화
echo "📝 1단계: 출석 코드 생성 및 활성화"
echo "POST $BASE_URL/api/admin/fix-attendance-codes"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/fix-attendance-codes" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 응답에서 결과 확인
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ 출석 코드 생성/활성화 완료!"
  
  # 생성/업데이트된 코드 수 출력
  CREATED=$(echo "$RESPONSE" | jq -r '.results.createdCodes' 2>/dev/null)
  UPDATED=$(echo "$RESPONSE" | jq -r '.results.updatedCodes' 2>/dev/null)
  TOTAL=$(echo "$RESPONSE" | jq -r '.results.totalStudents' 2>/dev/null)
  
  echo "   - 전체 학생: $TOTAL 명"
  echo "   - 새로 생성: $CREATED 개"
  echo "   - 활성화: $UPDATED 개"
else
  echo "❌ 출석 코드 생성/활성화 실패"
  exit 1
fi

echo ""
echo "🎉 완료! 이제 학생 코드로 출석 인증을 테스트하세요."
echo ""
echo "테스트 방법:"
echo "1. /dashboard/students 에서 아무 학생 클릭"
echo "2. 출석 코드(6자리) 복사"
echo "3. /attendance-verify 페이지에서 코드 입력"
echo "4. 출석 인증하기 버튼 클릭"
