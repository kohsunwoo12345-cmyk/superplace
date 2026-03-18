#!/bin/bash

echo "========================================="
echo "최종 검증: Admin 설정이 실제로 적용되는지 확인"
echo "========================================="
echo ""

echo "1️⃣ Admin 설정 확인"
echo "-------------------"
ADMIN_CONFIG=$(curl -s "https://suplacestudy.com/api/admin/homework-grading-config" -H "Authorization: Bearer test-token")
echo "$ADMIN_CONFIG" | jq -r '.config | {
  model: .model,
  temperature: .temperature,
  enableRAG: .enableRAG,
  systemPromptLength: (.systemPrompt | length),
  knowledgeBaseLength: (.knowledgeBase | length // 0)
}'

MODEL=$(echo "$ADMIN_CONFIG" | jq -r '.config.model')
echo ""
echo "✅ 설정된 모델: $MODEL"
echo ""

echo "2️⃣ 3분 대기 (Cloudflare Pages 배포 완료 대기)..."
echo "---------------------------------------------------"
sleep 180

echo ""
echo "3️⃣ 새로운 숙제 제출"
echo "-------------------"
SUBMISSION=$(curl -s -X POST "https://suplacestudy.com/api/homework-v2/submit" \
  -H "Content-Type: application/json" \
  -d '{"phone": "01051363624", "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="]}')

SUBMISSION_ID=$(echo "$SUBMISSION" | jq -r '.submission.id')
echo "제출 ID: $SUBMISSION_ID"
echo ""

echo "4️⃣ 20초 대기 (채점 완료 대기)..."
echo "--------------------------------"
sleep 20

echo ""
echo "5️⃣ 채점 결과 확인"
echo "-----------------"
RESULT=$(curl -s "https://suplacestudy.com/api/homework/debug-submission?submissionId=$SUBMISSION_ID")

echo "$RESULT" | jq -r '.grading | {
  score: .score,
  gradedBy: .gradedBy,
  subject: .subject,
  feedback: .feedback,
  problemAnalysisCount: (.problemAnalysis | fromjson | length),
  weaknessTypesCount: (.weaknessTypes | fromjson | length),
  totalQuestions: .totalQuestions,
  correctAnswers: .correctAnswers
}'

GRADED_BY=$(echo "$RESULT" | jq -r '.grading.gradedBy')

echo ""
echo "========================================="
echo "최종 검증 결과"
echo "========================================="
echo "설정된 모델: $MODEL"
echo "실제 사용된 모델: $GRADED_BY"
echo ""

if [[ "$GRADED_BY" == *"$MODEL"* ]] || [[ "$GRADED_BY" == *"Gemini"* ]]; then
  echo "✅ 성공: Admin 설정이 올바르게 적용되었습니다!"
else
  echo "❌ 실패: Admin 설정이 적용되지 않았습니다."
  echo "   예상: $MODEL 포함"
  echo "   실제: $GRADED_BY"
fi
echo ""
