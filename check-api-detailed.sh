#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE5LCJlbWFpbCI6Imdvc3Vud29vQGdtYWlsLmNvbSIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTcyNTE5NTYyMywiZXhwIjoxNzI1Mjc0ODIzfQ.Iu6qRxAYMRDZh8vCz9cpHjzp0dj4E-KPqsrNBL0F4jI"

echo "🔍 API 상세 확인"
echo "================="
echo ""

# 새 토큰으로 재시도 (토큰이 만료되었을 수 있음)
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/admin/academies")

echo "📊 전체 응답:"
echo "$RESPONSE" | jq '.'
echo ""

echo "📈 통계:"
echo "- Total: $(echo "$RESPONSE" | jq -r '.total')"
echo "- Source: $(echo "$RESPONSE" | jq -r '.source')"
echo "- Success: $(echo "$RESPONSE" | jq -r '.success')"
echo ""

echo "📋 학원 목록 (처음 5개):"
echo "$RESPONSE" | jq -r '.academies[]? | "\(.id) - \(.name) - \(.directorName)"' | head -5
echo ""

echo "🔢 고유 학원 ID 수:"
echo "$RESPONSE" | jq -r '.academies[]?.id' | sort -u | wc -l
