#!/bin/bash

echo "🧪 직접 숙제 제출 및 채점 테스트"
echo "=========================================="

# 1. 출석 코드로 사용자 정보 확인
CODE="402246"
echo "1️⃣ 출석 코드: $CODE"

# API로 사용자 정보 조회
echo ""
echo "2️⃣ 사용자 정보 조회 중..."
USER_INFO=$(curl -s "https://superplacestudy.pages.dev/api/attendance/verify?code=$CODE")
echo "$USER_INFO" | jq .

USER_ID=$(echo "$USER_INFO" | jq -r '.user.id // empty')
USER_NAME=$(echo "$USER_INFO" | jq -r '.user.name // empty')

if [ -z "$USER_ID" ]; then
  echo "❌ 사용자 정보를 찾을 수 없습니다"
  exit 1
fi

echo "✅ 사용자 확인: $USER_NAME (ID: $USER_ID)"

# 3. 실제 숙제 이미지 생성 (간단한 수학 문제)
echo ""
echo "3️⃣ 테스트 이미지 생성 중..."

# 더 큰 테스트 이미지 (100x100 빨간 픽셀)
BASE64_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAA3ElEQVR42u3RAQ0AAAjDMO5fNCCDkC5z0HTVriRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkvQ1GwAA//8DAEYQEwFjLQvsAAAAAElFTkSuQmCC"

echo "✅ 테스트 이미지 준비 완료"

# 4. 숙제 제출
echo ""
echo "4️⃣ 숙제 제출 중..."

SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_ID,
    \"code\": \"$CODE\",
    \"images\": [\"$BASE64_IMAGE\"]
  }")

echo "제출 응답:"
echo "$SUBMIT_RESPONSE" | jq .

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id // empty')

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ 제출 실패"
  exit 1
fi

echo ""
echo "✅ 제출 성공: $SUBMISSION_ID"
echo "   이제 백그라운드에서 채점이 진행됩니다..."

# 5. 채점 대기 (30초)
echo ""
echo "5️⃣ 30초 대기 중 (채점 완료까지)..."
for i in {30..1}; do
  echo -ne "\r   $i초 남음...  "
  sleep 1
done
echo ""

# 6. 채점 결과 확인 (관리자 토큰 필요 - 임시로 생성)
# 토큰 형식: userId|email|role|academyId|timestamp
TIMESTAMP=$(date +%s000)
ADMIN_TOKEN="1|admin@test.com|ADMIN|1|$TIMESTAMP"

echo ""
echo "6️⃣ 채점 결과 조회 중..."

# 오늘 날짜 (한국 시간)
TODAY=$(TZ=Asia/Seoul date +%Y-%m-%d)

RESULTS=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?userId=$USER_ID&startDate=2020-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "결과 조회 응답:"
echo "$RESULTS" | jq .

# 최신 제출 결과만 추출
LATEST_SCORE=$(echo "$RESULTS" | jq -r '.results[0].grading.score // 0')
LATEST_SUBJECT=$(echo "$RESULTS" | jq -r '.results[0].grading.subject // "없음"')
LATEST_TOTAL=$(echo "$RESULTS" | jq -r '.results[0].grading.totalQuestions // 0')
LATEST_CORRECT=$(echo "$RESULTS" | jq -r '.results[0].grading.correctAnswers // 0')
RESULT_COUNT=$(echo "$RESULTS" | jq -r '.results | length')

echo ""
echo "=========================================="
echo "📊 채점 결과 요약"
echo "=========================================="
echo "결과 개수: $RESULT_COUNT개"
echo "최신 제출:"
echo "  - 점수: $LATEST_SCORE점"
echo "  - 과목: $LATEST_SUBJECT"
echo "  - 정답: $LATEST_CORRECT / $LATEST_TOTAL"
echo ""

if [ "$RESULT_COUNT" == "2" ]; then
  echo "⚠️  경고: 결과가 2개입니다! (중복 채점 문제)"
elif [ "$RESULT_COUNT" == "1" ]; then
  echo "✅ 정상: 결과가 1개입니다"
fi

if [ "$LATEST_SCORE" == "0" ]; then
  echo "❌ 문제: 점수가 0점입니다!"
  echo ""
  echo "Python Worker 응답 확인이 필요합니다."
else
  echo "✅ 정상: 점수가 제대로 계산되었습니다"
fi

echo ""
echo "=========================================="
echo "✅ 테스트 완료"
echo "=========================================="

