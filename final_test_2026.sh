#!/bin/bash
set -e

echo "🚀 최종 검증 테스트 (2026-03-14)"
echo "========================================"

# 배포 대기
echo ""
echo "⏳ Cloudflare Pages 배포 대기 중... (90초)"
for i in {1..18}; do
  echo -n "."
  sleep 5
done
echo ""

# 1. 출석 인증
echo ""
echo "1️⃣  출석 인증..."
VERIFY=$(curl -s -X POST "https://superplacestudy.pages.dev/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d '{"code":"402246"}')

USER_ID=$(echo "$VERIFY" | jq -r '.student.id')
echo "✅ 사용자: $(echo "$VERIFY" | jq -r '.student.name') (ID: $USER_ID)"

# 2. 숙제 제출 (직접 grade 엔드포인트 호출)
echo ""
echo "2️⃣  숙제 제출 및 채점 시작..."
TEST_IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

GRADE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"code\":\"402246\",\"images\":[\"$TEST_IMG\"]}")

SUCCESS=$(echo "$GRADE" | jq -r '.success // false')
SUB_ID=$(echo "$GRADE" | jq -r '.submission.id // "none"')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ 제출 성공: $SUB_ID"
  echo "   상태: $(echo "$GRADE" | jq -r '.submission.status')"
else
  echo "❌ 제출 실패"
  echo "$GRADE" | jq '{error, message}'
  exit 1
fi

# 3. 채점 대기
echo ""
echo "3️⃣  채점 대기... (30초)"
for i in {1..6}; do
  echo -n "."
  sleep 5
done
echo ""

# 4. 결과 확인
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
    제출시간: .submission.submittedAt
  }
}'

# 5. 판정
echo ""
echo "========================================"
STATUS=$(echo "$RESULT" | jq -r '.results[0].submission.status // "unknown"')
SCORE=$(echo "$RESULT" | jq -r '.results[0].grading.score // null')

if [ "$STATUS" = "graded" ] && [ "$SCORE" != "null" ]; then
  echo "✅ 모든 테스트 성공!"
  echo "   📊 최종 점수: $SCORE"
  echo "   🌐 결과 페이지: https://superplacestudy.pages.dev/dashboard/homework/results/"
  exit 0
elif [ "$STATUS" = "failed" ]; then
  echo "❌ 채점 실패"
  exit 1
else
  echo "⏳ 채점 처리 중 (상태: $STATUS)"
  echo "   5분 후 다시 확인해주세요"
  exit 2
fi
