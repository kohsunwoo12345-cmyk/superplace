#!/bin/bash
echo "=== 🔍 전체 흐름 테스트 ==="
echo ""
echo "1️⃣ 학생 상세 페이지 - 부족한 개념 분석 테스트"
echo "📍 학생 ID: 157"
echo ""
curl -s "https://superplacestudy.pages.dev/api/students/weak-concepts?studentId=157" | jq '{cached, weakConceptsCount: (.weakConcepts | length), recommendationsCount: (.recommendations | length), summary: (.summary | length)}'
echo ""
echo "2️⃣ 숙제 제출 후 자동 채점 테스트"
echo "📍 사용자 ID: 3"
echo ""
curl -s "https://superplacestudy.pages.dev/api/homework/history?userId=3" | jq '.history[0] | {id, score, status, subject, submittedAt}'
echo ""
echo "3️⃣ 숙제 결과 페이지 확인"
TODAY_KST=$(TZ='Asia/Seoul' date +%Y-%m-%d)
echo "📅 오늘 날짜 (KST): $TODAY_KST"
echo ""
curl -s "https://superplacestudy.pages.dev/api/homework/results?date=$TODAY_KST" | jq '{totalSubmissions: .stats.totalSubmissions, averageScore: .stats.averageScore, pendingReview: .stats.pendingReview, firstSubmission: .submissions[0] | {id, userName, score, status: (if .score > 0 then "graded" else "pending" end)}}'
