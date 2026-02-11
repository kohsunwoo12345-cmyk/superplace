#!/bin/bash
echo "=== 🎯 배포된 페이지에서 이미지 표시 테스트 ==="
echo ""
echo "1️⃣ 숙제 결과 API 조회 (오늘 날짜 기준)"
TODAY_KST=$(TZ='Asia/Seoul' date +%Y-%m-%d)
echo "📅 오늘 날짜 (KST): $TODAY_KST"
echo ""
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?date=$TODAY_KST")
echo "📊 제출 건수:"
echo "$RESPONSE" | jq -r '.submissions | length'
echo ""
echo "2️⃣ 최근 제출의 이미지 정보:"
echo "$RESPONSE" | jq -r '.submissions[0] | {id, userName, score, subject, imageUrl}'
echo ""
echo "3️⃣ 특정 제출의 이미지 데이터 확인:"
SUBMISSION_ID=$(echo "$RESPONSE" | jq -r '.submissions[0].id')
echo "📎 제출 ID: $SUBMISSION_ID"
echo ""
curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=$SUBMISSION_ID" | jq '{success, submissionId, imageCount: (.images | length), firstImageSize: (.images[0] | length)}'
