#!/bin/bash

echo "============================================="
echo "   최종 검증: 숙제 결과 페이지 데이터 확인"
echo "============================================="

echo ""
echo "⏳ Cloudflare Pages 배포 대기 (90초)..."
sleep 90

echo ""
echo "=== 1️⃣ 최근 6개월 데이터 조회 (기본값) ==="
curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2025-09-14&endDate=2026-03-14" \
-H "Authorization: Bearer student-1771491307268-zavs7u5t0|student-1771491307055@temp.superplace.com|student|129|$(date +%s)000" \
| jq '{
  success: .success,
  error: .error,
  "총_제출": .statistics.total,
  "채점완료": .statistics.graded,
  "대기중": .statistics.pending,
  "평균점수": .statistics.averageScore,
  "샘플_5건": [.results[0:5][] | {
    id: .submission.id,
    이름: .submission.userName,
    날짜: .submission.submittedAt,
    상태: .submission.status,
    점수: .grading.score,
    과목: .grading.subject
  }]
}' 2>&1

echo ""
echo "=== 2️⃣ 전체 데이터 조회 (2024년 이후) ==="
curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
-H "Authorization: Bearer student-1771491307268-zavs7u5t0|student-1771491307055@temp.superplace.com|student|129|$(date +%s)000" \
| jq '{
  success: .success,
  "총_제출": .statistics.total,
  "채점완료": .statistics.graded,
  "최근_5건": [.results[0:5][] | {
    날짜: .submission.submittedAt,
    점수: .grading.score,
    상태: .submission.status
  }]
}' 2>&1

echo ""
echo "============================================="
echo "✅ 검증 완료!"
echo "============================================="

