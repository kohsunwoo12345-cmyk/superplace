#!/bin/bash
echo "🌐 Vercel 배포 URL 테스트"
echo "=========================="
echo ""

URLS=(
  "https://superplace-study.vercel.app"
  "https://superplace-study.vercel.app/api/health"
  "https://superplace-study.vercel.app/auth/signin"
  "https://superplace-study.vercel.app/dashboard/admin/users"
)

for url in "${URLS[@]}"; do
  echo "Testing: $url"
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "FAIL")
  if [ "$response" = "FAIL" ]; then
    echo "  ❌ 연결 실패 (DNS 문제 또는 서버 다운)"
  elif [ "$response" = "200" ]; then
    echo "  ✅ 200 OK"
  elif [ "$response" = "301" ] || [ "$response" = "302" ]; then
    echo "  ↗️  $response 리다이렉트"
  elif [ "$response" = "401" ] || [ "$response" = "403" ]; then
    echo "  🔒 $response 인증 필요"
  elif [ "$response" = "404" ]; then
    echo "  ❌ 404 Not Found"
  elif [ "$response" = "500" ]; then
    echo "  ❌ 500 Server Error"
  else
    echo "  ⚠️  $response"
  fi
  echo ""
done

echo "=========================="
echo "✅ 테스트 완료"
