#!/bin/bash

echo "=========================================="
echo "🧪 실제 랜딩페이지 생성 테스트"
echo "=========================================="

# 1. 실제 사용자로 로그인 시도 (토큰 가져오기)
echo ""
echo "Step 1: 테스트 사용자 정보 확인..."
STUDENT_ID="test-student-123"
SLUG="test_real_$(date +%s)_$(head -c 4 /dev/urandom | xxd -p)"

echo "  - StudentId: $STUDENT_ID"
echo "  - Slug: $SLUG"

# 2. POST 요청 (인증 없이)
echo ""
echo "Step 2: 랜딩페이지 생성 요청..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://superplacestudy.pages.dev/api/admin/landing-pages" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "'$SLUG'",
    "studentId": "'$STUDENT_ID'",
    "title": "실제 테스트 페이지",
    "subtitle": "오류 확인용",
    "templateId": "basic",
    "templateType": "basic",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "dataOptions": {
      "showAttendance": true,
      "showHomework": true
    },
    "customFormFields": [],
    "isActive": true
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq -C '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" -eq 200 ]; then
  echo ""
  echo "✅ Status 200 - 하지만 실제 생성 여부 확인 필요"
  
  # 3. 생성된 페이지 확인
  echo ""
  echo "Step 3: 생성된 페이지 확인..."
  PAGE_CHECK=$(curl -s "https://superplacestudy.pages.dev/lp/$SLUG")
  
  if echo "$PAGE_CHECK" | grep -q "페이지를 찾을 수 없습니다"; then
    echo "❌ 페이지가 생성되지 않았습니다!"
    echo ""
    echo "오류 원인:"
    echo "$PAGE_CHECK" | grep -E "오류|ERROR|error" | head -3
  elif echo "$PAGE_CHECK" | grep -q "오류"; then
    echo "⚠️ 페이지는 있지만 오류 발생"
    echo ""
    echo "오류 내용:"
    echo "$PAGE_CHECK" | grep -E "오류|ERROR" | head -3
  else
    echo "✅ 페이지가 정상적으로 생성되었습니다!"
    echo "   URL: https://superplacestudy.pages.dev/lp/$SLUG"
  fi
  
  # 4. 목록에서 확인
  echo ""
  echo "Step 4: 목록에서 확인..."
  LIST_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/admin/landing-pages")
  
  if echo "$LIST_RESPONSE" | grep -q "$SLUG"; then
    echo "✅ 목록에서 발견됨"
  else
    echo "❌ 목록에서 발견되지 않음"
    echo ""
    echo "최근 페이지 목록:"
    echo "$LIST_RESPONSE" | jq -C '.landingPages[:3] | .[] | {slug, title}' 2>/dev/null || echo "목록 파싱 실패"
  fi
  
else
  echo ""
  echo "❌ 생성 실패 (HTTP $HTTP_CODE)"
  echo ""
  echo "오류 분석:"
  
  # 오류 메시지 파싱
  if echo "$BODY" | jq -e '.error' >/dev/null 2>&1; then
    ERROR_MSG=$(echo "$BODY" | jq -r '.error')
    echo "  Error: $ERROR_MSG"
    
    # 구체적인 오류 타입 분석
    if echo "$ERROR_MSG" | grep -q "Invalid token"; then
      echo ""
      echo "🔍 원인: 인증 토큰 없음"
      echo "   해결: 로그인한 사용자의 토큰으로 요청해야 함"
    elif echo "$ERROR_MSG" | grep -q "NOT NULL"; then
      echo ""
      echo "🔍 원인: 필수 컬럼 누락"
      echo "   상세: $(echo "$ERROR_MSG" | grep -o 'NOT NULL constraint failed: [^:]*')"
    elif echo "$ERROR_MSG" | grep -q "FOREIGN KEY"; then
      echo ""
      echo "🔍 원인: 외래키 제약 위반"
      echo "   상세: user_id가 User 테이블에 존재하지 않음"
    fi
  else
    echo "  전체 응답: $BODY"
  fi
fi

echo ""
echo "=========================================="
echo "테스트 완료"
echo "=========================================="
