#!/bin/bash

echo "⏳ Waiting 5 minutes for Cloudflare Pages deployment..."
sleep 300

echo ""
echo "✅ Testing deployed API:"
echo ""

# Test the debug API (no auth required)
curl -s "https://superplacestudy.pages.dev/api/debug/simple-academies-test" | jq '{totalDirectors, processedAcademies}' 2>/dev/null || echo "API not ready yet"

echo ""
echo "🔗 Check these URLs in your browser:"
echo "1. https://superplacestudy.pages.dev/dashboard/admin/academies/ (should show 134 학원)"
echo "2. https://superplacestudy.pages.dev/dashboard/admin/bot-management/ (should show 134 in dropdown)"
echo "3. https://superplacestudy.pages.dev/dashboard/admin/director-limitations/ (should show 134 rows)"
