#!/bin/bash
# 학원 데이터 확인 스크립트

echo "🔍 학원 데이터 조회 테스트"
echo "=============================="

TOKEN=$(cat <<EOF | node -
const email = "admin@example.com";
const password = "password123";
const role = "ADMIN";
const academyId = "1";
const timestamp = Date.now();
const token = [email, email, role, academyId, timestamp].join('|');
console.log(token);
EOF
)

echo "📡 API 호출: /api/admin/academies"
curl -s -X GET "https://superplacestudy.pages.dev/api/admin/academies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '
{
  success: .success,
  total: .total,
  source: .source,
  academies_count: (.academies | length),
  first_5_academies: (.academies[0:5] | map({
    id: .id,
    name: .name,
    directorName: .directorName,
    studentCount: .studentCount
  }))
}'

echo ""
echo "📊 User 테이블 학원장 확인"
curl -s -X GET "https://superplacestudy.pages.dev/api/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '
{
  success: .success,
  total: .total,
  directors_count: ([.users[] | select(.role == "DIRECTOR")] | length),
  first_5_directors: ([.users[] | select(.role == "DIRECTOR")][0:5] | map({
    id: .id,
    name: .name,
    email: .email,
    academyId: .academyId,
    academyName: .academyName
  }))
}'
