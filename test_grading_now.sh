#!/bin/bash
set -e

echo "🧪 현재 채점 API 테스트 (최신 배포 확인)"
echo "========================================="

# 1. 사용자 인증 (출석 코드 402246)
echo ""
echo "1️⃣  출석 인증 중..."
VERIFY_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d '{"code":"402246"}')

USER_ID=$(echo "$VERIFY_RESPONSE" | jq -r '.student.userId // empty')
STUDENT_NAME=$(echo "$VERIFY_RESPONSE" | jq -r '.student.name // empty')

if [ -z "$USER_ID" ]; then
  echo "❌ 사용자 인증 실패"
  echo "$VERIFY_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ 사용자 인증 성공: $STUDENT_NAME (ID: $USER_ID)"

# 2. 숙제 제출 (작은 테스트 이미지)
echo ""
echo "2️⃣  숙제 제출 중..."
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit/index" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"code\":\"402246\",\"images\":[\"$TEST_IMAGE\"]}")

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id // empty')

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ 제출 실패"
  echo "$SUBMIT_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ 제출 성공: $SUBMISSION_ID"
echo "   상태: $(echo "$SUBMIT_RESPONSE" | jq -r '.submission.status')"

# 3. 채점 대기 (40초)
echo ""
echo "3️⃣  채점 중... (40초 대기)"
for i in {1..8}; do
  echo -n "."
  sleep 5
done
echo ""

# 4. 결과 확인 (최근 제출 내역)
echo ""
echo "4️⃣  결과 확인 중..."
ADMIN_TOKEN="1|admin@superplace.co.kr|ADMIN|$(date +%s)000"

RESULTS=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?userId=$USER_ID&startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$RESULTS" | jq '{
  success: .success,
  total: .statistics.total,
  graded: .statistics.graded,
  pending: .statistics.pending,
  avgScore: .statistics.averageScore,
  latestSubmission: .results[0] | {
    id: .submission.id,
    status: .submission.status,
    score: .grading.score,
    subject: .grading.subject,
    submittedAt: .submission.submittedAt
  }
}'

# 5. 판정
echo ""
echo "========================================="
LATEST_STATUS=$(echo "$RESULTS" | jq -r '.results[0].submission.status // "unknown"')
LATEST_SCORE=$(echo "$RESULTS" | jq -r '.results[0].grading.score // "null"')

if [ "$LATEST_STATUS" = "graded" ] && [ "$LATEST_SCORE" != "null" ]; then
  echo "✅ 채점 성공!"
  echo "   점수: $LATEST_SCORE"
else
  echo "⚠️  채점 실패 또는 대기 중"
  echo "   상태: $LATEST_STATUS"
  echo "   점수: $LATEST_SCORE"
  
  # 실패한 제출 상세 확인
  echo ""
  echo "🔍 제출 상세 정보:"
  echo "$RESULTS" | jq '.results[0]'
fi
