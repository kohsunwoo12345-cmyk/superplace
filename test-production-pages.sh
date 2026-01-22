#!/bin/bash

BASE_URL="https://superplace-study.vercel.app"

echo "🧪 AI Gems 페이지 테스트"
echo "=========================================="
echo ""

PAGES=(
  "/dashboard/ai-gems"
  "/dashboard/ai-gems/study-helper"
  "/dashboard/ai-gems/writing-coach"
  "/dashboard/ai-gems/math-tutor"
  "/dashboard/ai-gems/english-partner"
  "/dashboard/ai-gems/science-lab"
  "/dashboard/ai-gems/creative-maker"
  "/dashboard/ai-gems/career-counselor"
  "/dashboard/ai-gems/mental-coach"
  "/dashboard/ai-chatbot"
)

for page in "${PAGES[@]}"; do
  echo "Testing: ${BASE_URL}${page}"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${page}")
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ Status: $HTTP_CODE - 페이지 존재!"
  elif [ "$HTTP_CODE" = "404" ]; then
    echo "  ❌ Status: $HTTP_CODE - 페이지 없음"
  elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo "  🔐 Status: $HTTP_CODE - 인증 필요 (정상)"
  else
    echo "  ⚠️  Status: $HTTP_CODE"
  fi
  echo ""
done

echo "=========================================="
echo ""
echo "🌐 테스트 URL:"
echo "   ${BASE_URL}/dashboard/ai-gems"
echo ""
echo "🔑 로그인 정보:"
echo "   이메일: admin@superplace.com"
echo "   비밀번호: admin123!@#"
echo ""
