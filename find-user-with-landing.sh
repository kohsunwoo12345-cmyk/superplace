#!/bin/bash

echo "🔍 랜딩페이지가 있는 사용자 찾기..."
echo ""

# DB에서 랜딩페이지가 있는 사용자 조회
curl -s "https://superplacestudy.pages.dev/api/debug/db-structure" | \
  jq -r '.results.landing_pages.sample[]? | "User ID: \(.user_id), LP ID: \(.id), Title: \(.title)"' 2>/dev/null

echo ""
echo "================================"
echo "위 사용자들 중 하나를 선택하여 테스트하거나,"
echo "또는 테스트용 고정 URL을 사용하여 발송합니다."
