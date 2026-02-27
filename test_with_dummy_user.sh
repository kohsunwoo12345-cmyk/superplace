#!/bin/bash

echo "=========================================="
echo "🧪 Dummy User로 랜딩페이지 생성 테스트"
echo "=========================================="

# 실제 토큰 형식 사용 (email이 토큰에 포함된 형태)
# 형식: {userId}|{email}|{role}
TEST_TOKEN="test-user-123|test@example.com|DIRECTOR"

echo ""
echo "테스트 토큰: $TEST_TOKEN"
echo ""

SLUG="test_auth_$(date +%s)_$(openssl rand -hex 3)"
echo "생성할 Slug: $SLUG"
echo ""

echo "랜딩페이지 생성 요청..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://superplacestudy.pages.dev/api/admin/landing-pages" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "'$SLUG'",
    "studentId": "test-student-123",
    "title": "테스트 페이지 with Auth",
    "subtitle": "인증 포함",
    "templateType": "basic",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "isActive": true
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response:"
echo "$BODY" | jq -C '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" -eq 403 ]; then
  echo "❌ 403 Forbidden - 사용자가 DB에 존재하지 않음"
  echo ""
  echo "해결 방법:"
  echo "1. Cloudflare D1 콘솔에서 다음 SQL 실행:"
  echo ""
  echo "INSERT INTO User (id, email, name, role, password)"
  echo "VALUES ('test-user-123', 'test@example.com', 'Test User', 'DIRECTOR', 'dummy');"
  echo ""
elif [ "$HTTP_CODE" -eq 401 ]; then
  echo "❌ 401 Unauthorized - 토큰 형식 오류"
elif [ "$HTTP_CODE" -eq 500 ]; then
  echo "❌ 500 Server Error - DB 오류 발생"
  echo ""
  if echo "$BODY" | grep -q "FOREIGN KEY"; then
    echo "🔍 FOREIGN KEY 제약 위반"
    echo "   user_id가 User 테이블에 없거나 타입 불일치"
  elif echo "$BODY" | grep -q "NOT NULL"; then
    echo "🔍 NOT NULL 제약 위반"
    echo "   필수 컬럼이 누락됨"
  fi
elif [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ 생성 성공!"
  echo ""
  echo "생성된 페이지 확인..."
  sleep 2
  PAGE_CHECK=$(curl -s "https://superplacestudy.pages.dev/lp/$SLUG")
  
  if echo "$PAGE_CHECK" | grep -q "페이지를 찾을 수 없습니다"; then
    echo "⚠️ HTTP 200이지만 페이지가 DB에 없음 (INSERT 실패)"
  elif echo "$PAGE_CHECK" | grep -q "오류"; then
    echo "⚠️ 페이지는 있지만 렌더링 오류"
  else
    echo "✅ 페이지 정상 작동!"
    echo "   https://superplacestudy.pages.dev/lp/$SLUG"
  fi
fi

echo ""
echo "=========================================="
