#!/bin/bash

echo "=== 학생 검색 API 테스트 ==="
echo ""

echo "1. URL 인코딩 테스트 (영문)..."
curl -s "https://suplacestudy.com/api/admin/search-student?name=test" | jq '.' 2>/dev/null || echo "Failed"
echo ""

echo "2. URL 인코딩 테스트 (한글 - 고선우)..."
NAME_ENCODED=$(printf "%s" "고선우" | jq -sRr @uri)
echo "Encoded: $NAME_ENCODED"
curl -s "https://suplacestudy.com/api/admin/search-student?name=$NAME_ENCODED" | jq '.'
echo ""

echo "3. 전체 학생 목록 (이름 포함)..."
for ID in {1..10}; do
  CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID")
  if echo "$CODE_RESPONSE" | grep -q '"success":true'; then
    echo "  ID $ID: 코드 있음"
  fi
done
