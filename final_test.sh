#!/bin/bash
echo "=== 🎯 최종 통합 테스트 ==="
echo ""
echo "1️⃣ 부족한 개념 분석 - 학생 3번 (숙제 데이터 있음)"
curl -X POST "https://superplacestudy.pages.dev/api/students/weak-concepts" \
  -H "Content-Type: application/json" \
  -d '{"studentId": 3}' \
  -s | jq '{success, weakConceptsCount: (.weakConcepts | length), recommendationsCount: (.recommendations | length), summaryPreview: (.summary | .[0:100]), chatCount, homeworkCount}'
echo ""
echo "2️⃣ 숙제 결과 페이지 - 오늘 제출"
TODAY_KST=$(TZ='Asia/Seoul' date +%Y-%m-%d)
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?date=$TODAY_KST")
echo "📊 전체 제출: $(echo "$RESPONSE" | jq '.stats.totalSubmissions')건"
echo "📊 평균 점수: $(echo "$RESPONSE" | jq '.stats.averageScore')점"
echo "📊 채점 대기: $(echo "$RESPONSE" | jq '.stats.pendingReview')건"
echo ""
echo "3️⃣ 최근 채점 완료 제출 (점수 > 0)"
echo "$RESPONSE" | jq '.submissions | map(select(.score > 0)) | .[0] | {id, userName, score, subject, imageUrl, hasImages: (.imageUrl != null)}'
echo ""
echo "4️⃣ 특정 제출의 이미지 확인"
GRADED_ID=$(echo "$RESPONSE" | jq -r '.submissions | map(select(.score > 0)) | .[0].id')
echo "📎 제출 ID: $GRADED_ID"
curl -s "https://superplacestudy.pages.dev/api/homework/images?submissionId=$GRADED_ID" | jq '{success, imageCount: (.images | length), firstImageSize: (.images[0] | length)}'
