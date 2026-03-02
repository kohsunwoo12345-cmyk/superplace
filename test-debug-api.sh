#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE5LCJlbWFpbCI6Imdvc3Vud29vQGdtYWlsLmNvbSIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTcyNTE5NTYyMywiZXhwIjoxNzI1Mjc0ODIzfQ.Iu6qRxAYMRDZh8vCz9cpHjzp0dj4E-KPqsrNBL0F4jI"

echo "🔍 Testing Debug API: academyId Distribution"
echo "=============================================="
echo ""

echo "⏳ Waiting 3 minutes for deployment..."
sleep 180
echo "✅ Wait complete"
echo ""

echo "📡 Calling /api/admin/debug/academies-distribution..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://superplacestudy.pages.dev/api/admin/debug/academies-distribution" | jq '.'
