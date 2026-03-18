#!/bin/bash

echo "🔍 실제 학생/학원장 계정 조회"
echo "===================================="

# Cloudflare D1 데이터베이스 조회
# wrangler d1 execute를 사용하여 실제 데이터 확인

echo ""
echo "📊 1. 학원 정보 조회"
echo "-----------------------------------"
npx wrangler d1 execute superplace-db --command="
SELECT id, name, directorEmail, directorName, createdAt
FROM academies 
WHERE isActive = 1
LIMIT 5
" 2>/dev/null || echo "❌ 학원 조회 실패"

echo ""
echo "👥 2. 학생 계정 조회"
echo "-----------------------------------"
npx wrangler d1 execute superplace-db --command="
SELECT id, email, name, role, academyId
FROM users 
WHERE role = 'STUDENT' 
  AND academyId IS NOT NULL
LIMIT 5
" 2>/dev/null || echo "❌ 학생 조회 실패"

echo ""
echo "👔 3. 학원장 계정 조회"
echo "-----------------------------------"
npx wrangler d1 execute superplace-db --command="
SELECT id, email, name, role, academyId
FROM users 
WHERE role = 'DIRECTOR' 
  AND academyId IS NOT NULL
LIMIT 5
" 2>/dev/null || echo "❌ 학원장 조회 실패"

echo ""
echo "🤖 4. 학생 봇 할당 확인"
echo "-----------------------------------"
npx wrangler d1 execute superplace-db --command="
SELECT 
  a.id, a.userId, a.botId, a.userAcademyId,
  a.startDate, a.endDate, a.status,
  b.name as botName
FROM ai_bot_assignments a
LEFT JOIN ai_bots b ON a.botId = b.id
WHERE a.status = 'active'
  AND date(a.endDate) >= date('now')
LIMIT 10
" 2>/dev/null || echo "❌ 봇 할당 조회 실패"

echo ""
echo "===================================="
