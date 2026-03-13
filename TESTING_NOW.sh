#!/bin/bash

echo "⏳ 배포 완료 대기 중 (90초)..."
sleep 90

echo ""
echo "🧪 최종 테스트 시작"
echo "======================================"

ADMIN_TOKEN="1|admin@superplace.co.kr|ADMIN|$(date +%s)000"
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
ERROR=$(echo "$RESPONSE" | jq -r '.error // "none"')
MESSAGE=$(echo "$RESPONSE" | jq -r '.message // "none"')

echo ""
echo "API 응답:"
echo "$RESPONSE" | jq '{success, error, message, total: .statistics.totalSubmissions}'

echo ""
echo "======================================"
if [ "$SUCCESS" = "true" ]; then
    echo "✅ SUCCESS! 시스템 정상 작동"
    echo "======================================"
    echo ""
    echo "이제 다음 URL에서 테스트하세요:"
    echo "1. 숙제 제출: https://superplacestudy.pages.dev/attendance-verify/"
    echo "   - 코드: 402246"
    echo "2. 결과 확인: https://superplacestudy.pages.dev/dashboard/homework/results/"
    echo "3. 학생 상세: https://superplacestudy.pages.dev/dashboard/students"
else
    echo "❌ 아직 배포 중이거나 오류 발생"
    echo "======================================"
    echo "오류: $ERROR"
    echo "메시지: $MESSAGE"
    echo ""
    echo "5분 후 다시 확인하거나 Cloudflare Pages 대시보드를 확인하세요."
fi

