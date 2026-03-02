#!/bin/bash
echo "🔍 현재 배포된 API 테스트"
echo "=============================="

# 임시 토큰 생성 (실제로는 로그인 필요)
TOKEN="test@example.com|test@example.com|ADMIN|1|$(date +%s)000"

echo "📡 1. /api/admin/academies 호출"
curl -s -X GET "https://superplacestudy.pages.dev/api/admin/academies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '{
  success: .success,
  total: .total,
  source: .source,
  academies_count: (.academies | length),
  first_3: (.academies[0:3] | map({id: .id, name: .name, directorName: .directorName})),
  unique_academy_ids: [.academies[].id] | unique | length
}'

echo ""
echo "📡 2. /api/admin/users 호출 - 학원장 수 확인"
curl -s -X GET "https://superplacestudy.pages.dev/api/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '{
  success: .success,
  total: .total,
  directors: ([.users[]? | select(.role == "DIRECTOR")] | length),
  unique_academy_ids: [.users[]? | select(.role == "DIRECTOR") | .academyId] | unique | length,
  sample_directors: ([.users[]? | select(.role == "DIRECTOR")][0:3] | map({name: .name, academyId: .academyId, academyName: .academyName}))
}'
