#!/bin/bash

echo "🧪 테이블 마이그레이션 테스트"
echo "====================================="

# 120초 대기
echo ""
echo "⏳ 배포 대기 (120초)..."
for i in {1..24}; do
  echo -n "."
  sleep 5
done
echo ""

# 1. 인증
echo ""
echo "1️⃣  사용자 인증..."
VERIFY=$(curl -s -X POST "https://superplacestudy.pages.dev/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d '{"code":"402246"}')

USER_ID=$(echo "$VERIFY" | jq -r '.student.id')
echo "✅ $USER_ID"

# 2. 채점 (테이블 마이그레이션 트리거)
echo ""
echo "2️⃣  숙제 제출 (마이그레이션 트리거)..."
TEST_IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

GRADE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/grade" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"code\":\"402246\",\"images\":[\"$TEST_IMG\"]}")

SUCCESS=$(echo "$GRADE" | jq -r '.success // false')
ERROR=$(echo "$GRADE" | jq -r '.error // "none"')

echo ""
if [ "$SUCCESS" = "true" ]; then
  echo "✅ 채점 성공!"
  echo "$GRADE" | jq '{submission: .submission | {id, status}, results: .results | length}'
else
  echo "❌ 채점 실패: $ERROR"
  echo "$GRADE" | jq '{error, message}'
  exit 1
fi

# 3. 결과 조회
echo ""
echo "3️⃣  결과 조회 (30초 후)..."
sleep 30

TOKEN="1|admin@superplace.co.kr|ADMIN|$(date +%s)000"
RESULT=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?userId=$USER_ID&startDate=2026-03-14&endDate=2026-03-14" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESULT" | jq '{
  성공: .success,
  전체: .statistics.total,
  채점완료: .statistics.graded,
  최신: .results[0] | {
    ID: .submission.id,
    상태: .submission.status,
    점수: .grading.score,
    과목: .grading.subject
  }
}'

# 최종 판정
LATEST_SCORE=$(echo "$RESULT" | jq -r '.results[0].grading.score // null')
if [ "$LATEST_SCORE" != "null" ]; then
  echo ""
  echo "========================================="
  echo "✅ 전체 테스트 성공!"
  echo "   점수: $LATEST_SCORE"
  echo "   페이지: https://superplacestudy.pages.dev/dashboard/homework/results/"
else
  echo ""
  echo "⚠️  점수가 아직 null - 채점 처리 중"
fi
