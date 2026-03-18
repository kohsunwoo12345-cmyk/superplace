#!/bin/bash

echo "=== 실제 숙제 이미지로 테스트 ==="
echo "1. 관리자 설정 확인"
ADMIN_CONFIG=$(curl -s "https://suplacestudy.com/api/admin/homework-grading-config" \
  -H "Authorization: Bearer test-token")
echo "$ADMIN_CONFIG" | jq -r '.config | {model, temperature, enableRAG, promptLength: (.systemPrompt | length), knowledgeBaseLength: (.knowledgeBase | length // 0)}'

echo ""
echo "2. 새로운 숙제 제출 (실제 이미지 사용)"
# Base64 인코딩된 간단한 수학 문제 이미지 생성
# 숫자 "2+3=?" 를 담은 이미지 (실제로는 사용자가 제출한 이미지를 사용해야 함)
REAL_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

SUBMISSION=$(curl -s -X POST "https://suplacestudy.com/api/homework-v2/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"code\": \"01051363624\",
    \"images\": [\"data:image/png;base64,${REAL_IMAGE}\"]
  }")

SUBMISSION_ID=$(echo "$SUBMISSION" | jq -r '.submissionId')
echo "제출 ID: $SUBMISSION_ID"

echo ""
echo "3. 20초 대기 (채점 완료 대기)..."
sleep 20

echo ""
echo "4. 채점 결과 확인"
RESULT=$(curl -s "https://suplacestudy.com/api/homework/debug-submission?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer test-token")

echo "$RESULT" | jq -r '
{
  score: .grading.score,
  gradedBy: .grading.gradedBy,
  subject: .grading.subject,
  feedback: .grading.feedback,
  problemAnalysisCount: (.grading.problemAnalysis | fromjson | length),
  weaknessTypesCount: (.grading.weaknessTypes | fromjson | length),
  totalQuestions: .grading.totalQuestions,
  correctAnswers: .grading.correctAnswers
}'

echo ""
echo "=== 테스트 완료 ==="
