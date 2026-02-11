#!/bin/bash
echo "=== 🔍 숙제 제출 후 자동 채점 흐름 분석 ==="
echo ""
echo "1️⃣ 최근 제출 확인 (0점 제출)"
TODAY_KST=$(TZ='Asia/Seoul' date +%Y-%m-%d)
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?date=$TODAY_KST")
PENDING=$(echo "$RESPONSE" | jq '.submissions | map(select(.score == 0)) | .[0]')
echo "$PENDING" | jq '{id, userName, score, completion, submittedAt}'
echo ""
PENDING_ID=$(echo "$PENDING" | jq -r '.id')
echo "📎 채점 대기 ID: $PENDING_ID"
echo ""
echo "2️⃣ 출석 인증 페이지에서 자동 채점 호출 코드 확인"
grep -A 20 "자동 채점 시작" src/app/attendance-verify/page.tsx | head -25
