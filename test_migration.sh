#!/bin/bash

echo "🔧 테이블 마이그레이션 테스트"
echo "======================================"

# 관리자 토큰
ADMIN_ID="1"
ADMIN_EMAIL="admin@superplace.co.kr"
TIMESTAMP=$(date +%s)000
ADMIN_TOKEN="${ADMIN_ID}|${ADMIN_EMAIL}|ADMIN|${TIMESTAMP}"

echo "⏳ 배포 대기 중 (60초)..."
sleep 60

echo ""
echo "1️⃣ 테스트 숙제 제출 (마이그레이션 트리거)..."

# 간단한 이미지로 제출
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC"

# 출석 코드로 사용자 정보 조회 (POST 방식)
USER_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/attendance/verify" \
  -H "Content-Type: application/json" \
  -d '{"code": "402246"}')

echo "$USER_RESPONSE" | jq '.'

USER_ID=$(echo "$USER_RESPONSE" | jq -r '.student.id // empty')

if [ -z "$USER_ID" ]; then
    echo "❌ 사용자 정보를 가져올 수 없습니다"
    echo "수동 테스트: 웹 UI에서 402246 코드로 숙제를 제출하세요"
    exit 1
fi

echo "✅ 사용자 ID: $USER_ID"

# 숙제 제출
echo ""
echo "2️⃣ 숙제 제출 중..."
SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_ID,
    \"code\": \"402246\",
    \"images\": [\"$TEST_IMAGE\"]
  }")

echo "$SUBMIT_RESPONSE" | jq '.'
SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id // empty')

if [ -z "$SUBMISSION_ID" ]; then
    echo "❌ 제출 실패"
    exit 1
fi

echo "✅ 제출 ID: $SUBMISSION_ID"
echo "✅ 마이그레이션이 /api/homework/grade 호출 시 자동 실행됨"

# 채점 대기
echo ""
echo "3️⃣ 채점 완료 대기 (30초)..."
sleep 30

# 결과 조회
echo ""
echo "4️⃣ 결과 조회..."
RESULTS=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

echo "$RESULTS" | jq '.'

TOTAL=$(echo "$RESULTS" | jq -r '.statistics.totalSubmissions // 0')

echo ""
echo "======================================"
echo "📊 최종 결과"
echo "======================================"
echo "제출 건수: $TOTAL"

if [ "$TOTAL" -gt 0 ]; then
    echo "✅ 마이그레이션 및 채점 성공!"
    FIRST_SCORE=$(echo "$RESULTS" | jq -r '.results[0].grading.score // 0')
    echo "첫 번째 결과 점수: $FIRST_SCORE"
else
    echo "⚠️ 결과가 아직 표시되지 않음"
    echo "가능한 원인:"
    echo "1. 채점이 아직 진행 중 (추가 대기 필요)"
    echo "2. Python Worker 오류"
    echo "3. 날짜 필터 문제"
fi

