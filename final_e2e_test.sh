#!/bin/bash
set -e

echo "🚀 최종 End-to-End 테스트"
echo "======================================"

# 배포 대기 (2분)
echo ""
echo "⏳ Cloudflare Pages 배포 대기 (120초)..."
for i in {1..24}; do
  echo -n "."
  sleep 5
done
echo ""

# 1. 사용자 인증
echo ""
echo "1️⃣  출석 인증 (코드: 402246)..."
VERIFY=$(curl -s -X POST "https://superplacestudy.pages.dev/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d '{"code":"402246"}')

USER_ID=$(echo "$VERIFY" | jq -r '.student.id')
USER_NAME=$(echo "$VERIFY" | jq -r '.student.name')

if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
  echo "❌ 인증 실패"
  echo "$VERIFY" | jq '.'
  exit 1
fi

echo "✅ $USER_NAME (ID: $USER_ID)"

# 2. 숙제 제출 및 채점
echo ""
echo "2️⃣  숙제 제출 및 채점..."
TEST_IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

GRADE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"code\":\"402246\",\"images\":[\"$TEST_IMG\"]}")

SUCCESS=$(echo "$GRADE" | jq -r '.success // false')
SUB_ID=$(echo "$GRADE" | jq -r '.submission.id // "none"')

if [ "$SUCCESS" != "true" ]; then
  echo "❌ 제출 실패"
  echo "$GRADE" | jq '{error, message}'
  exit 1
fi

echo "✅ 제출 성공: $SUB_ID"

# 3. 채점 완료 대기
echo ""
echo "3️⃣  채점 처리 대기 (30초)..."
for i in {1..6}; do
  echo -n "."
  sleep 5
done
echo ""

# 4. 결과 조회
echo ""
echo "4️⃣  결과 조회..."
TOKEN="1|admin@superplace.co.kr|ADMIN|$(date +%s)000"

RESULT=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?userId=$USER_ID&startDate=2026-03-14&endDate=2026-03-14" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESULT" | jq '{
  성공: .success,
  통계: {
    전체: .statistics.total,
    채점완료: .statistics.graded,
    대기중: .statistics.pending,
    평균점수: .statistics.averageScore
  },
  최신제출: .results[0] | {
    제출ID: .submission.id,
    상태: .submission.status,
    점수: .grading.score,
    과목: .grading.subject,
    정답수: "\(.grading.correctAnswers // 0)/\(.grading.totalQuestions // 0)",
    피드백: (.grading.feedback // "" | .[0:50]),
    제출시간: .submission.submittedAt
  }
}'

# 5. 최종 판정
echo ""
echo "======================================"
API_SUCCESS=$(echo "$RESULT" | jq -r '.success')
STATUS=$(echo "$RESULT" | jq -r '.results[0].submission.status // "unknown"')
SCORE=$(echo "$RESULT" | jq -r '.results[0].grading.score // null')

if [ "$API_SUCCESS" != "true" ]; then
  echo "❌ API 오류"
  echo "$RESULT" | jq '{error, message}'
  exit 1
fi

if [ "$STATUS" = "graded" ] && [ "$SCORE" != "null" ] && [ "$SCORE" != "0" ]; then
  echo "✅ 전체 테스트 성공!"
  echo ""
  echo "📊 결과 요약:"
  echo "   - 제출 ID: $SUB_ID"
  echo "   - 상태: $STATUS"
  echo "   - 점수: $SCORE"
  echo "   - 과목: $(echo "$RESULT" | jq -r '.results[0].grading.subject')"
  echo ""
  echo "🌐 결과 페이지:"
  echo "   https://superplacestudy.pages.dev/dashboard/homework/results/"
  exit 0
elif [ "$STATUS" = "failed" ]; then
  echo "❌ 채점 실패"
  echo "$RESULT" | jq '.results[0]'
  exit 1
else
  echo "⏳ 채점 처리 중 (상태: $STATUS, 점수: $SCORE)"
  echo "   5-10분 후 다시 확인해주세요"
  exit 2
fi
