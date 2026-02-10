#!/bin/bash

echo "======================================"
echo "🔍 SSR Fix Deployment Check"
echo "======================================"
echo ""

echo "📦 Local Commit Status:"
git log --oneline -3

echo ""
echo "🌐 Testing Student Detail Page..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://superplacestudy.pages.dev/dashboard/students/detail/?id=157")

if [ "$RESPONSE" = "200" ]; then
  echo "✅ Page returns HTTP 200 OK"
else
  echo "⚠️  Page returns HTTP $RESPONSE"
fi

echo ""
echo "📊 Build Information:"
echo "- Commit: 24ed14e"
echo "- Fix: SSR sessionStorage access protection"
echo "- Status: Deployed to main branch"

echo ""
echo "🧪 Testing Instructions:"
echo "1. Clear browser cache (Ctrl+Shift+R)"
echo "2. Visit: https://superplacestudy.pages.dev/dashboard/students/detail/?id=157"
echo "3. Check for 'Application error' message"
echo "4. Open console (F12) and check for errors"
echo "5. Test '학생 계정으로 로그인' button"

echo ""
echo "⏱️  Deployment Status:"
echo "- Cloudflare Pages typically takes 5-7 minutes"
echo "- Check: https://dash.cloudflare.com → Workers & Pages → superplace"

echo ""
echo "======================================"
