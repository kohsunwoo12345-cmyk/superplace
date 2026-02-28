#!/bin/bash

echo "=== 랜딩페이지 수정 기능 테스트 ==="
echo ""

# 1. 랜딩페이지 목록 조회
echo "1. 랜딩페이지 목록 조회 테스트"
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/admin/landing-pages" \
  -H "Authorization: Bearer test-token")

echo "응답: $RESPONSE"

# 페이지 ID 추출
PAGE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PAGE_ID" ]; then
  echo "❌ 랜딩페이지가 없습니다. 먼저 페이지를 생성해주세요."
  exit 1
fi

echo "✅ 랜딩페이지 ID: $PAGE_ID"
echo ""

# 2. 특정 랜딩페이지 조회
echo "2. 랜딩페이지 상세 조회 테스트 (ID: $PAGE_ID)"
DETAIL_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/admin/landing-pages?id=$PAGE_ID" \
  -H "Authorization: Bearer test-token")

echo "응답: $DETAIL_RESPONSE"

# 성공 여부 확인
if echo "$DETAIL_RESPONSE" | grep -q '"success":true'; then
  echo "✅ 랜딩페이지 조회 성공"
else
  echo "❌ 랜딩페이지 조회 실패"
  exit 1
fi
echo ""

# 3. 랜딩페이지 수정 테스트
echo "3. 랜딩페이지 수정 테스트"
UPDATE_RESPONSE=$(curl -s -X PUT "https://superplacestudy.pages.dev/api/admin/landing-pages" \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$PAGE_ID\",
    \"title\": \"테스트 제목 {{studentName}}\",
    \"subtitle\": \"테스트 부제목 {{period}}\",
    \"htmlContent\": \"<h1>{{studentName}}님의 출석률: {{attendanceRate}}%</h1><p>총 일수: {{totalDays}}, 출석: {{presentDays}}, 결석: {{absentDays}}</p>\"
  }")

echo "응답: $UPDATE_RESPONSE"

if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
  echo "✅ 랜딩페이지 수정 성공"
else
  echo "❌ 랜딩페이지 수정 실패"
fi
echo ""

# 4. 수정된 페이지 확인
echo "4. 수정된 랜딩페이지 확인"
UPDATED_DETAIL=$(curl -s "https://superplacestudy.pages.dev/api/admin/landing-pages?id=$PAGE_ID" \
  -H "Authorization: Bearer test-token")

echo "응답: $UPDATED_DETAIL"

if echo "$UPDATED_DETAIL" | grep -q '{{studentName}}'; then
  echo "✅ HTML 변수가 저장되었습니다"
else
  echo "❌ HTML 변수가 저장되지 않았습니다"
fi
echo ""

echo "=== 테스트 완료 ==="
