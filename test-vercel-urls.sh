#!/bin/bash

echo "🔍 Vercel 배포 URL 전체 테스트"
echo "=================================="
echo ""

DOMAINS=(
  "superplacestudy.vercel.app"
  "superplace.vercel.app"
  "super-place-marketing.vercel.app"
  "superplace-kohsunwoo12345-cmyk.vercel.app"
  "superplacestudy-kohsunwoo12345-cmyk.vercel.app"
)

for domain in "${DOMAINS[@]}"; do
  echo "Testing: https://$domain"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" 2>&1)
  VERCEL_ERROR=$(curl -s -I "https://$domain" 2>&1 | grep "x-vercel-error" | cut -d' ' -f2 | tr -d '\r')
  
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "308" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "  ✅ Status: $HTTP_CODE - 배포 존재!"
    echo "  🌐 URL: https://$domain"
    echo ""
    break
  else
    echo "  ❌ Status: $HTTP_CODE"
    if [ ! -z "$VERCEL_ERROR" ]; then
      echo "  Error: $VERCEL_ERROR"
    fi
  fi
  echo ""
done

echo "=================================="
