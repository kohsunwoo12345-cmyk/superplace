#!/bin/bash

echo "=== users 테이블 상세 조회 ==="
echo ""

echo "1. 전체 사용자 수:"
curl -s -X POST "https://suplacestudy.com/api/debug/query" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT COUNT(*) as count FROM users"}' | jq '.results[0]' 2>/dev/null
echo ""

echo "2. 역할별 사용자 수:"
curl -s -X POST "https://suplacestudy.com/api/debug/query" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT role, COUNT(*) as count FROM users GROUP BY role"}' | jq '.results' 2>/dev/null
echo ""

echo "3. ID 18-25 사용자 정보:"
curl -s -X POST "https://suplacestudy.com/api/debug/query" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT id, name, email, role FROM users WHERE id >= 18 AND id <= 25"}' | jq '.results' 2>/dev/null
echo ""

echo "4. student_attendance_codes에 있지만 users에 없는 userId:"
curl -s -X POST "https://suplacestudy.com/api/debug/query" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT DISTINCT sac.userId FROM student_attendance_codes sac LEFT JOIN users u ON sac.userId = u.id WHERE u.id IS NULL LIMIT 10"}' | jq '.results' 2>/dev/null
