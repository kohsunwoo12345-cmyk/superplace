#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE5LCJlbWFpbCI6Imdvc3Vud29vQGdtYWlsLmNvbSIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTcyNTE5NTYyMywiZXhwIjoxNzI1Mjc0ODIzfQ.Iu6qRxAYMRDZh8vCz9cpHjzp0dj4E-KPqsrNBL0F4jI"

echo "🔍 Testing /api/admin/academies with detailed output"
echo "====================================================="
echo ""

RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://superplacestudy.pages.dev/api/admin/academies")

echo "📊 Total academies: $(echo "$RESPONSE" | jq -r '.total')"
echo "📋 Source: $(echo "$RESPONSE" | jq -r '.source')"
echo "🎯 Success: $(echo "$RESPONSE" | jq -r '.success')"
echo ""

echo "📝 All academies:"
echo "$RESPONSE" | jq -r '.academies[] | "  - ID: \(.id), Name: \(.name), Director: \(.directorName // "N/A")"'
echo ""

echo "🔢 Academy ID distribution:"
echo "$RESPONSE" | jq -r '[.academies[].id] | group_by(.) | map({id: .[0], count: length}) | .[] | "  ID \(.id): \(.count) times"'
