#!/bin/bash
echo "🔍 Checking directors and their academyId values"
echo "================================================"

# Get token from test script
TOKEN=$(grep 'TOKEN=' test-current-api.sh | cut -d'"' -f2)

echo ""
echo "📡 Fetching directors from /api/admin/users..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://superplacestudy.pages.dev/api/admin/users?role=DIRECTOR" | \
  jq '{
    success: .success,
    total: (.users // [] | length),
    directors_with_academyId: [.users[]? | select(.academyId != null) | {name, academyId}] | length,
    directors_without_academyId: [.users[]? | select(.academyId == null)] | length,
    unique_academy_ids: [.users[]?.academyId // empty] | unique | length,
    sample_directors: [.users[]? | {name, email, academyId, role}][0:5]
  }'
