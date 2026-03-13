#!/bin/bash

echo "🔍 숙제 데이터 디버깅"
echo "======================================"

# 관리자 토큰 생성
ADMIN_ID="1"
ADMIN_EMAIL="admin@superplace.co.kr"
TIMESTAMP=$(date +%s)000
ADMIN_TOKEN="${ADMIN_ID}|${ADMIN_EMAIL}|ADMIN|${TIMESTAMP}"

echo "관리자 토큰: $ADMIN_TOKEN"
echo ""

# 1. 전체 기간 조회 (날짜 필터 없이)
echo "1️⃣ 전체 기간 결과 조회..."
RESULTS=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

echo "$RESULTS" | jq '.'

# 통계 출력
TOTAL=$(echo "$RESULTS" | jq -r '.statistics.totalSubmissions // 0')
GRADED=$(echo "$RESULTS" | jq -r '.statistics.gradedSubmissions // 0')
PENDING=$(echo "$RESULTS" | jq -r '.statistics.pendingSubmissions // 0')

echo ""
echo "======================================"
echo "📊 통계 요약"
echo "======================================"
echo "전체 제출: $TOTAL"
echo "채점 완료: $GRADED"
echo "대기 중: $PENDING"

if [ "$TOTAL" -gt 0 ]; then
    echo ""
    echo "✅ 데이터 존재!"
    echo ""
    echo "최근 5개 제출:"
    echo "$RESULTS" | jq -r '.results[0:5] | .[] | "\(.submissionId) - \(.userName) - 점수:\(.grading.score) - 제출:\(.submittedAt)"'
else
    echo ""
    echo "❌ 데이터 없음"
    echo "가능한 원인:"
    echo "1. homework_submissions_v2 테이블에 데이터가 없음"
    echo "2. homework_gradings_v2 테이블에 데이터가 없음"
    echo "3. JOIN 조건 문제로 조회 실패"
    echo "4. 날짜 필터링 문제"
fi

