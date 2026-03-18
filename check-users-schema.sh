#!/bin/bash

echo "=== users 테이블 스키마 확인 ==="
echo ""

# Check users schema
echo "📝 Test 1: users 테이블 스키마 조회"
curl -X GET "https://suplacestudy.com/api/admin/check-users-schema" \
  -H "Content-Type: application/json" \
  -s | head -50

echo ""
echo ""
echo "📝 Test 2: 실제 users 레코드 샘플 조회 (컬럼명 확인)"
curl -X GET "https://suplacestudy.com/api/admin/check-users-schema" \
  -H "Content-Type: application/json" \
  -s | grep -o '"columns":\[.*\]' | head -1

