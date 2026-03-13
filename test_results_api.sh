#!/bin/bash

echo "🔍 숙제 결과 API 테스트"
echo "======================================"

# 1. 최근 제출된 숙제 확인
echo ""
echo "1️⃣ 최근 제출 기록 확인..."
curl -s "https://superplacestudy.pages.dev/api/homework/results" \
  -H "Content-Type: application/json" | jq '.' > /tmp/results_response.json

cat /tmp/results_response.json

echo ""
echo "2️⃣ 응답 분석..."
TOTAL=$(cat /tmp/results_response.json | jq -r '.statistics.totalSubmissions // 0')
GRADED=$(cat /tmp/results_response.json | jq -r '.statistics.gradedSubmissions // 0')
PENDING=$(cat /tmp/results_response.json | jq -r '.statistics.pendingSubmissions // 0')

echo "전체 제출: $TOTAL"
echo "채점 완료: $GRADED"
echo "대기 중: $PENDING"

if [ "$TOTAL" -eq 0 ]; then
    echo "⚠️ 제출된 숙제가 없습니다"
else
    echo "✅ $TOTAL 개의 제출 기록 발견"
    
    # 첫 번째 결과 상세 정보
    echo ""
    echo "3️⃣ 첫 번째 결과 상세:"
    cat /tmp/results_response.json | jq '.results[0]' > /tmp/first_result.json
    
    SUBMISSION_ID=$(cat /tmp/first_result.json | jq -r '.submissionId // "N/A"')
    USER_NAME=$(cat /tmp/first_result.json | jq -r '.userName // "N/A"')
    SCORE=$(cat /tmp/first_result.json | jq -r '.grading.score // "N/A"')
    STATUS=$(cat /tmp/first_result.json | jq -r '.status // "N/A"')
    
    echo "제출 ID: $SUBMISSION_ID"
    echo "학생 이름: $USER_NAME"
    echo "점수: $SCORE"
    echo "상태: $STATUS"
fi

echo ""
echo "======================================"
