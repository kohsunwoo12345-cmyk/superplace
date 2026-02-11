#!/bin/bash
echo "=== 🧪 자동 채점 테스트 ==="
echo ""
echo "1️⃣ 채점 대기 중인 제출 ID: homework-1770846388059-7ohzdefwp"
echo ""
echo "2️⃣ 수동으로 채점 API 호출..."
timeout 45 curl -X POST "https://superplacestudy.pages.dev/api/homework/process-grading" \
  -H "Content-Type: application/json" \
  -d '{"submissionId":"homework-1770846388059-7ohzdefwp"}' \
  -s | jq '{success, message, score: .grading.score, subject: .grading.subject}'
echo ""
echo "3️⃣ 채점 후 상태 확인..."
sleep 2
curl -s "https://superplacestudy.pages.dev/api/homework/history?userId=157" | jq '.history[0] | {id, score, status, subject}'
