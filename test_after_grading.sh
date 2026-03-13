#!/bin/bash

echo "⏰ 채점 완료 대기 (추가 30초)..."
sleep 30

ADMIN_ID="1"
ADMIN_EMAIL="admin@superplace.co.kr"
TIMESTAMP=$(date +%s)000
ADMIN_TOKEN="${ADMIN_ID}|${ADMIN_EMAIL}|ADMIN|${TIMESTAMP}"

echo ""
echo "📊 결과 조회 시도..."
RESULTS=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

echo "$RESULTS" | jq '.'

TOTAL=$(echo "$RESULTS" | jq -r '.statistics.totalSubmissions // 0')
echo ""
echo "제출 건수: $TOTAL"

if [ "$TOTAL" -gt 0 ]; then
    echo "✅ 마이그레이션 성공!"
    FIRST_SCORE=$(echo "$RESULTS" | jq -r '.results[0].grading.score // 0')
    echo "첫 번째 결과 점수: $FIRST_SCORE"
else
    echo "❌ 여전히 오류 발생 - 데이터베이스 스키마 문제"
fi

