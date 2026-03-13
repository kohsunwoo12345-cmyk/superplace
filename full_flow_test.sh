#!/bin/bash

echo "🧪 전체 숙제 제출 및 조회 플로우 테스트"
echo "=========================================="

# 1. 출석 코드 402246으로 사용자 정보 가져오기
echo ""
echo "1️⃣ 사용자 정보 조회 (코드: 402246)..."
USER_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/attendance/verify?code=402246")
echo "$USER_RESPONSE" | jq '.'

USER_ID=$(echo "$USER_RESPONSE" | jq -r '.user.id // empty')
USER_NAME=$(echo "$USER_RESPONSE" | jq -r '.user.name // empty')
USER_EMAIL=$(echo "$USER_RESPONSE" | jq -r '.user.email // empty')

if [ -z "$USER_ID" ]; then
    echo "❌ 사용자 정보를 가져올 수 없습니다"
    exit 1
fi

echo "✅ 사용자 ID: $USER_ID"
echo "✅ 사용자 이름: $USER_NAME"

# 2. 간단한 테스트 이미지 (수학 문제 예시)
echo ""
echo "2️⃣ 테스트 이미지 준비..."
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC"

# 3. 숙제 제출 API 호출
echo ""
echo "3️⃣ 숙제 제출 중..."
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

# 4. 채점 완료 대기 (30초)
echo ""
echo "4️⃣ 채점 대기 (30초)..."
sleep 30

# 5. homework_submissions_v2 테이블에서 직접 조회
echo ""
echo "5️⃣ 제출 데이터 조회..."
# Cloudflare Pages 환경에서는 직접 DB 접근이 불가능하므로 API를 통해 확인

# 6. 결과 조회 (날짜 범위를 넓게 설정)
echo ""
echo "6️⃣ 결과 조회 (최근 7일)..."
END_DATE=$(date -u +%Y-%m-%d)
START_DATE=$(date -u -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -u -v-7d +%Y-%m-%d 2>/dev/null || echo "2024-01-01")

# 인증 토큰 생성 (userId|email|role|timestamp)
TIMESTAMP=$(date +%s)000
TOKEN="${USER_ID}|${USER_EMAIL}|STUDENT|${TIMESTAMP}"

echo "인증 토큰: $TOKEN"

RESULTS_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=${START_DATE}&endDate=${END_DATE}&userId=${USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$RESULTS_RESPONSE" | jq '.'

# 결과 분석
TOTAL=$(echo "$RESULTS_RESPONSE" | jq -r '.statistics.totalSubmissions // 0')
echo ""
echo "======================================"
echo "📊 최종 결과"
echo "======================================"
echo "제출 건수: $TOTAL"

if [ "$TOTAL" -gt 0 ]; then
    echo "✅ 숙제 제출 및 조회 성공!"
    FIRST_SCORE=$(echo "$RESULTS_RESPONSE" | jq -r '.results[0].grading.score // 0')
    echo "첫 번째 결과 점수: $FIRST_SCORE"
else
    echo "❌ 결과가 없습니다"
    echo "원인 분석:"
    echo "- 날짜 필터 문제: 한국 시간과 UTC 시간 차이"
    echo "- userId 필터 문제: 결과가 다른 userId로 저장됨"
    echo "- 채점 미완료: Python Worker가 아직 처리 중"
fi

