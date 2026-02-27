#!/bin/bash

echo "=========================================="
echo "🧪 최종 랜딩페이지 생성 테스트"
echo "=========================================="

# 실제 토큰 형식 사용
TEST_TOKEN="admin-001|admin@superplace.com|SUPER_ADMIN"
SLUG="final_test_$(date +%s)"

echo ""
echo "테스트 정보:"
echo "  Token: $TEST_TOKEN"
echo "  Slug: $SLUG"
echo ""

echo "랜딩페이지 생성 요청 중..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://superplacestudy.pages.dev/api/admin/landing-pages" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "'$SLUG'",
    "studentId": "test-student-123",
    "title": "최종 테스트 페이지",
    "subtitle": "FK 제약 제거 후 테스트",
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

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ 성공!"
  
  # 페이지 확인
  echo ""
  echo "생성된 페이지 확인 중..."
  sleep 2
  
  PAGE_URL="https://superplacestudy.pages.dev/lp/$SLUG"
  PAGE_CHECK=$(curl -s "$PAGE_URL")
  
  if echo "$PAGE_CHECK" | grep -q "페이지를 찾을 수 없습니다"; then
    echo "⚠️ 페이지가 DB에 없습니다"
  elif echo "$PAGE_CHECK" | grep -q "오류"; then
    echo "⚠️ 페이지 렌더링 오류"
  else
    echo "✅ 페이지 정상 작동!"
    echo "   URL: $PAGE_URL"
  fi
else
  echo "❌ 실패 (HTTP $HTTP_CODE)"
  
  if echo "$BODY" | grep -q "FOREIGN KEY"; then
    echo ""
    echo "🚨 여전히 FK 오류 발생!"
    echo "   → 테이블에 아직 FK가 남아있음"
    echo "   → PRAGMA foreign_key_list(landing_pages); 다시 확인 필요"
  fi
fi

echo ""
echo "=========================================="
