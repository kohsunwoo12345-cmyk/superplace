#!/bin/bash
echo "=== 🔍 자동 채점이 안되는 이유 분석 ==="
echo ""
echo "1️⃣ 제출 API 응답 확인 - submissionId가 제대로 반환되는가?"
echo "제출 API: functions/api/homework/submit.ts"
grep -A 10 "submission:" functions/api/homework/submit.ts | head -15
echo ""
echo "2️⃣ 프론트엔드에서 submissionId 추출 확인"
grep -B 5 "자동 채점 시작" src/app/attendance-verify/page.tsx | head -10
echo ""
echo "3️⃣ 실제 채점 대기 제출의 제출 시간 확인"
TODAY_KST=$(TZ='Asia/Seoul' date +%Y-%m-%d)
curl -s "https://superplacestudy.pages.dev/api/homework/results?date=$TODAY_KST" | jq '.submissions | map(select(.score == 0)) | .[0] | {id, submittedAt, completion}'
