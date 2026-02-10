#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🔍 Academy 테이블 데이터 확인"
echo "=============================="
echo ""

echo "1️⃣ Academy 목록 조회 (관리자 API)"
RESPONSE=$(curl -s "${BASE_URL}/api/admin/academies")
echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "2️⃣ 첫 번째 academy의 id 확인"
FIRST_ID=$(echo "$RESPONSE" | grep -o '"id":[^,}]*' | head -1 | cut -d':' -f2 | tr -d ' ')
echo "첫 번째 academy id: '$FIRST_ID'"

echo ""
echo "📊 분석:"
echo "   - academy 테이블에 데이터가 있는가?"
echo "   - id가 어떤 형식으로 저장되어 있는가? (1, '1', '1.0'?)"
echo "   - name 필드가 존재하는가?"

