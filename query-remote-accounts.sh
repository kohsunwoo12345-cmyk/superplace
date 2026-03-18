#!/bin/bash

echo "🔍 원격 데이터베이스 계정 조회"
echo "===================================="

echo ""
echo "📊 1. 학원 정보"
npx wrangler d1 execute superplace-db --remote --command="
SELECT id, name, directorEmail, directorName 
FROM academies 
WHERE isActive = 1 
LIMIT 3
" 2>&1 | grep -v "wrangler" | grep -v "Resource"

echo ""
echo "👥 2. 학생 계정 (최근 5명)"
npx wrangler d1 execute superplace-db --remote --command="
SELECT id, email, name, role, academyId 
FROM users 
WHERE LOWER(role) = 'student' 
ORDER BY createdAt DESC 
LIMIT 5
" 2>&1 | grep -v "wrangler" | grep -v "Resource"

echo ""
echo "👔 3. 학원장 계정 (최근 5명)"
npx wrangler d1 execute superplace-db --remote --command="
SELECT id, email, name, role, academyId 
FROM users 
WHERE LOWER(role) = 'director' 
ORDER BY createdAt DESC 
LIMIT 5
" 2>&1 | grep -v "wrangler" | grep -v "Resource"

echo ""
echo "===================================="
