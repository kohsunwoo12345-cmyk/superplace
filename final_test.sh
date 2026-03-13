#!/bin/bash

echo "🔧 최종 테스트 - 배포 대기 및 검증"
echo "======================================"

echo "⏳ 배포 대기 중 (60초)..."
sleep 60

ADMIN_ID="1"
ADMIN_EMAIL="admin@superplace.co.kr"
TIMESTAMP=$(date +%s)000
ADMIN_TOKEN="${ADMIN_ID}|${ADMIN_EMAIL}|ADMIN|${TIMESTAMP}"

echo ""
echo "📊 결과 조회..."
RESULTS=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

echo "$RESULTS" | jq '.'

TOTAL=$(echo "$RESULTS" | jq -r '.statistics.totalSubmissions // 0')
SUCCESS=$(echo "$RESULTS" | jq -r '.success')

echo ""
echo "======================================"
echo "📊 최종 결과"
echo "======================================"
echo "API 성공 여부: $SUCCESS"
echo "제출 건수: $TOTAL"

if [ "$SUCCESS" = "true" ] && [ "$TOTAL" -gt 0 ]; then
    echo ""
    echo "✅ 수정 완료! 시스템 정상 작동"
    echo ""
    echo "최근 제출 5건:"
    echo "$RESULTS" | jq -r '.results[0:5] | .[] | "- \(.userName): \(.grading.score)점 (\(.grading.subject)) - \(.submittedAt)"'
elif [ "$SUCCESS" = "true" ]; then
    echo ""
    echo "✅ API 정상 작동 (데이터 없음)"
    echo "숙제를 제출하면 여기에 표시됩니다"
else
    echo ""
    echo "❌ 아직 오류 발생"
    ERROR=$(echo "$RESULTS" | jq -r '.error // "알 수 없음"')
    MESSAGE=$(echo "$RESULTS" | jq -r '.message // ""')
    echo "오류: $ERROR"
    [ -n "$MESSAGE" ] && echo "메시지: $MESSAGE"
fi

