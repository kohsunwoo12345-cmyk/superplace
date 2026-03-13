#!/bin/bash

echo "==================================="
echo "⏳ Cloudflare Pages 배포 대기..."
echo "==================================="
sleep 120

TOKEN="student-1771491307268-zavs7u5t0|1773523200000|9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08|129"

echo -e "\n==================================="
echo "🎯 최종 UI 데이터 검증"
echo "==================================="

echo -e "\n📊 2026-03-14 결과 조회..."
RESULT=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?date=2026-03-14" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESULT" | jq '{
  total: .statistics.total,
  graded: .statistics.graded,
  first_result: .results[0] | {
    id: .submission.id,
    userName: .submission.userName,
    userEmail: .submission.userEmail,
    imageCount: .submission.imageCount,
    score: .grading.score,
    subject: .grading.subject,
    status: .submission.status
  }
}'

echo -e "\n==================================="
echo "📋 화면 표시 확인 항목"
echo "==================================="
echo "$RESULT" | jq -r '.results[0] | "
✅ 제출 ID: \(.submission.id)
✅ 학생 이름: \(.submission.userName)
✅ 이메일: \(.submission.userEmail)
✅ 이미지 개수: \(.submission.imageCount)
✅ 점수: \(.grading.score)
✅ 과목: \(.grading.subject)
✅ 상태: \(.submission.status)
✅ 제출 시간: \(.submission.submittedAt)
"'

echo -e "\n==================================="
echo "✅ 테스트 완료!"
echo "==================================="
echo ""
echo "🌐 웹 페이지에서 확인하세요:"
echo "   https://superplacestudy.pages.dev/dashboard/homework/results/"
echo ""
echo "🔍 F12 콘솔에서 확인:"
echo "   - submissions 배열에 데이터가 있어야 함"
echo "   - 각 submission에 id, userName, score 등이 있어야 함"
