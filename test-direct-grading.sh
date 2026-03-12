#!/bin/bash
set -e

echo "======================================"
echo "🧪 process-grading API 직접 테스트"
echo "======================================"
echo ""

BASE_URL="https://superplacestudy.pages.dev"

# 최근 제출된 숙제 ID 사용
SUBMISSION_ID="homework-1773308523085-ljqybbnjq"

echo "📋 제출 ID: $SUBMISSION_ID"
echo ""

echo "1️⃣ process-grading API 직접 호출..."
GRADING_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/homework/process-grading" \
  -H "Content-Type: application/json" \
  -d "{\"submissionId\": \"$SUBMISSION_ID\"}")

echo "$GRADING_RESPONSE" | jq '.'
echo ""

echo "2️⃣ 채점 결과 확인 (5초 대기 후)..."
sleep 5

STATUS=$(curl -s "${BASE_URL}/api/homework/status/${SUBMISSION_ID}")
echo "$STATUS" | jq '{score, subject, totalQuestions, correctAnswers, feedback, problemAnalysis: (.problemAnalysis | length)}'
echo ""
