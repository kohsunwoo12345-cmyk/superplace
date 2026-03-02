#!/bin/bash

echo "🔍 테스트 중: 학원장 132명 표시 확인..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Bearer token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE5LCJlbWFpbCI6Imdvc3Vud29vQGdtYWlsLmNvbSIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImFjYWRlbXlJZCI6MSwiaWF0IjoxNzM4NDgxNzY2LCJleHAiOjE3Mzg0ODUzNjZ9.Z_eiLrr-Ln9fOA7oTgnLWV-bE3K7GvSYRqTxP_RL3Sw"

# API call
response=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://superplacestudy.pages.dev/api/admin/academies")

# Parse response
total=$(echo "$response" | jq -r '.total // 0')
success=$(echo "$response" | jq -r '.success // false')
academies_count=$(echo "$response" | jq -r '.academies | length // 0')

echo "📊 결과:"
echo "  • Success: $success"
echo "  • Total: $total"
echo "  • Academies Count: $academies_count"
echo ""

if [ "$academies_count" -eq 132 ]; then
  echo "✅ 성공! 132명의 학원장이 모두 표시됩니다!"
  echo ""
  echo "📋 확인 URL:"
  echo "  1. 학원 관리: https://superplacestudy.pages.dev/dashboard/admin/academies/"
  echo "  2. AI 봇 할당: https://superplacestudy.pages.dev/dashboard/admin/bot-management/"
  echo "  3. 학원장 제한 설정: https://superplacestudy.pages.dev/dashboard/admin/director-limitations/"
  echo ""
  echo "🎯 다음 단계: Vectorize 인덱스 생성"
  echo "  가이드: /home/user/webapp/VECTORIZE_비개발자_가이드.md"
elif [ "$academies_count" -gt 0 ]; then
  echo "⚠️  아직 배포 중입니다. 현재 $academies_count개 표시됨"
  echo "  3-5분 후 다시 확인해주세요."
else
  echo "❌ 오류 발생!"
  echo "  Response: $response"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
