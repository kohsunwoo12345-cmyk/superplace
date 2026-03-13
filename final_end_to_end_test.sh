#!/bin/bash

echo "🧪 완전한 End-to-End 테스트"
echo "=========================================="
echo ""

# 테스트 사용자 ID (코드 402246에 해당하는 사용자)
USER_ID="1771491306"

# 테스트 이미지 (1x1 픽셀)
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "1️⃣ 숙제 제출 (/api/homework/submit)"
echo "=========================================="

SUBMIT_RESP=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_ID,
    \"code\": \"402246\",
    \"images\": [\"$TEST_IMAGE\"]
  }")

echo "$SUBMIT_RESP" | jq . 2>/dev/null || echo "$SUBMIT_RESP"

SUBMISSION_ID=$(echo "$SUBMIT_RESP" | jq -r '.submission.id // empty' 2>/dev/null)

if [ -z "$SUBMISSION_ID" ]; then
  echo ""
  echo "❌ 제출 실패"
  echo "   응답: $SUBMIT_RESP"
  exit 1
fi

echo ""
echo "✅ 제출 성공: $SUBMISSION_ID"
echo "   백그라운드 채점이 진행 중입니다..."
echo ""

# 30초 대기
echo "2️⃣ 30초 대기 중 (채점 완료까지)..."
for i in {30..1}; do
  printf "\r   %2d초 남음..." $i
  sleep 1
done
echo ""
echo ""

# 관리자 토큰 생성
TIMESTAMP=$(date +%s000)
ADMIN_TOKEN="1|admin@test.com|ADMIN|1|$TIMESTAMP"

echo "3️⃣ 채점 결과 조회 (/api/homework/results)"
echo "=========================================="

RESULTS_RESP=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?userId=$USER_ID&startDate=2020-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$RESULTS_RESP" | jq . 2>/dev/null || echo "$RESULTS_RESP"

# 결과 분석
RESULT_COUNT=$(echo "$RESULTS_RESP" | jq -r '.results | length // 0' 2>/dev/null)
LATEST_SCORE=$(echo "$RESULTS_RESP" | jq -r '.results[0].grading.score // 0' 2>/dev/null)
LATEST_SUBJECT=$(echo "$RESULTS_RESP" | jq -r '.results[0].grading.subject // "N/A"' 2>/dev/null)
LATEST_TOTAL=$(echo "$RESULTS_RESP" | jq -r '.results[0].grading.totalQuestions // 0' 2>/dev/null)
LATEST_CORRECT=$(echo "$RESULTS_RESP" | jq -r '.results[0].grading.correctAnswers // 0' 2>/dev/null)

echo ""
echo "=========================================="
echo "📊 테스트 결과 요약"
echo "=========================================="
echo "제출 ID: $SUBMISSION_ID"
echo "결과 개수: $RESULT_COUNT개"
echo ""
echo "최신 채점 결과:"
echo "  - 점수: $LATEST_SCORE점"
echo "  - 과목: $LATEST_SUBJECT"
echo "  - 정답: $LATEST_CORRECT / $LATEST_TOTAL"
echo ""

# 문제 진단
if [ "$RESULT_COUNT" == "0" ]; then
  echo "❌ 문제 1: 결과가 없습니다"
  echo "   → /api/homework/grade가 호출되지 않았거나"
  echo "   → homework_gradings_v2에 저장되지 않음"
elif [ "$RESULT_COUNT" -gt "1" ]; then
  echo "⚠️  문제 2: 결과가 $RESULT_COUNT개입니다 (중복 채점)"
fi

if [ "$LATEST_SCORE" == "0" ] && [ "$RESULT_COUNT" != "0" ]; then
  echo "❌ 문제 3: 점수가 0점입니다"
  echo "   → Python Worker가 문제를 인식하지 못함"
  echo "   → OCR 실패 또는 채점 로직 오류"
fi

if [ "$LATEST_TOTAL" == "0" ] && [ "$RESULT_COUNT" != "0" ]; then
  echo "❌ 문제 4: 총 문제 수가 0입니다"
  echo "   → Python Worker 응답이 비정상"
fi

if [ "$RESULT_COUNT" == "1" ] && [ "$LATEST_SCORE" != "0" ] && [ "$LATEST_TOTAL" != "0" ]; then
  echo "✅ 모든 테스트 통과!"
fi

echo "=========================================="

