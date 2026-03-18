#!/bin/bash
echo "🔍 실제 학생/학원장 계정 찾기..."
echo ""

export CLOUDFLARE_API_TOKEN=2TsXVbUX09DhLOtxqOdRXzM6bYH_q3BjKYlqEDsy

echo "📝 1. 학원 목록 조회"
ACADEMIES=$(npx wrangler d1 execute superplace-db --remote --command "SELECT id, name FROM academies LIMIT 5" 2>/dev/null)
echo "$ACADEMIES"
echo ""

echo "📝 2. 학생 계정 찾기 (STUDENT 역할)"
STUDENTS=$(npx wrangler d1 execute superplace-db --remote --command "SELECT id, name, email, role, academyId FROM users WHERE role = 'STUDENT' LIMIT 5" 2>/dev/null)
echo "$STUDENTS"
echo ""

echo "📝 3. 학원장 계정 찾기 (OWNER/TEACHER 역할)"
OWNERS=$(npx wrangler d1 execute superplace-db --remote --command "SELECT id, name, email, role, academyId FROM users WHERE role IN ('OWNER', 'TEACHER') LIMIT 5" 2>/dev/null)
echo "$OWNERS"
echo ""

echo "📝 4. 봇 할당 확인"
ASSIGNMENTS=$(npx wrangler d1 execute superplace-db --remote --command "SELECT userId, botId, academyId, status FROM ai_bot_assignments LIMIT 10" 2>/dev/null)
echo "$ASSIGNMENTS"
echo ""

echo "✅ 계정 조회 완료"
