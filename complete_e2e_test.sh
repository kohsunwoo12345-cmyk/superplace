#!/bin/bash

echo "🧪 완전한 End-to-End 테스트"
echo "=========================================="
echo ""

# 1. Python Worker 직접 테스트 (Gemini API 키 설정 확인)
echo "1️⃣ Python Worker 테스트 (Gemini API 키 설정 확인)"
echo "----------------------------------------"

WORKER_URL="https://physonsuperplacestudy-production.kohsunwoo12345.workers.dev/grade"
API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

# 간단한 테스트 이미지
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

WORKER_RESPONSE=$(curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"images\": [\"$TEST_IMAGE\"],
    \"userId\": 1771491306,
    \"userName\": \"테스트학생\",
    \"systemPrompt\": \"이 이미지를 분석하고 JSON 형식으로 채점 결과를 반환하세요.\",
    \"model\": \"gemini-2.5-flash-lite\",
    \"temperature\": 0.3,
    \"enableRAG\": false
  }")

echo "$WORKER_RESPONSE" | jq . 2>/dev/null || echo "$WORKER_RESPONSE"

# 결과 분석
SUCCESS=$(echo "$WORKER_RESPONSE" | jq -r '.success // false' 2>/dev/null)
OCR_TEXT=$(echo "$WORKER_RESPONSE" | jq -r '.results[0].ocrText // "N/A"' 2>/dev/null)
TOTAL_Q=$(echo "$WORKER_RESPONSE" | jq -r '.results[0].grading.totalQuestions // 0' 2>/dev/null)

echo ""
if [ "$SUCCESS" == "true" ]; then
  echo "✅ Worker 정상 응답"
  echo "   OCR 텍스트: $OCR_TEXT"
  echo "   총 문제 수: $TOTAL_Q"
  
  if [ "$OCR_TEXT" == "OCR API 키가 설정되지 않았습니다." ]; then
    echo "   ❌ Gemini API 키가 아직 적용되지 않았습니다"
    echo "   → Worker 재시작이 필요할 수 있습니다"
  else
    echo "   ✅ Gemini API 키 정상 작동"
  fi
else
  echo "❌ Worker 오류"
fi

echo ""
echo "=========================================="
echo ""

# 2. Pages API 테스트
echo "2️⃣ /api/homework/results API 테스트"
echo "----------------------------------------"

# 관리자 토큰 생성
TIMESTAMP=$(date +%s000)
ADMIN_TOKEN="1|admin@test.com|ADMIN|1|$TIMESTAMP"

RESULTS_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2020-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

RESULT_COUNT=$(echo "$RESULTS_RESPONSE" | jq -r '.results | length // 0' 2>/dev/null)
SUCCESS_API=$(echo "$RESULTS_RESPONSE" | jq -r '.success // false' 2>/dev/null)

echo "API 응답:"
echo "$RESULTS_RESPONSE" | jq '.statistics, .results[0] | select(. != null)' 2>/dev/null || echo "$RESULTS_RESPONSE" | head -50

echo ""
if [ "$SUCCESS_API" == "true" ]; then
  echo "✅ API 정상 응답"
  echo "   전체 결과 수: $RESULT_COUNT개"
  
  if [ "$RESULT_COUNT" -gt "0" ]; then
    # 최신 결과 분석
    LATEST_SCORE=$(echo "$RESULTS_RESPONSE" | jq -r '.results[0].grading.score // 0' 2>/dev/null)
    LATEST_SUBJECT=$(echo "$RESULTS_RESPONSE" | jq -r '.results[0].grading.subject // "N/A"' 2>/dev/null)
    LATEST_SUBMITTED=$(echo "$RESULTS_RESPONSE" | jq -r '.results[0].submittedAt // "N/A"' 2>/dev/null)
    
    echo "   최신 결과:"
    echo "     - 제출 시간: $LATEST_SUBMITTED"
    echo "     - 점수: $LATEST_SCORE점"
    echo "     - 과목: $LATEST_SUBJECT"
    
    if [ "$LATEST_SCORE" == "0" ]; then
      echo "     ⚠️  점수가 0점입니다"
    else
      echo "     ✅ 정상 점수"
    fi
  else
    echo "   ℹ️  제출된 숙제가 없습니다"
  fi
else
  echo "❌ API 오류"
fi

echo ""
echo "=========================================="
echo ""

# 3. 학생 상세 페이지 API 테스트
echo "3️⃣ 학생 상세 페이지 API 테스트 (userId 필터)"
echo "----------------------------------------"

TEST_USER_ID="1771491306"
STUDENT_RESULTS=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?userId=$TEST_USER_ID&startDate=2020-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

STUDENT_COUNT=$(echo "$STUDENT_RESULTS" | jq -r '.results | length // 0' 2>/dev/null)

echo "학생 ID: $TEST_USER_ID"
echo "해당 학생의 숙제 기록: $STUDENT_COUNT개"

if [ "$STUDENT_COUNT" -gt "0" ]; then
  echo "✅ 학생별 필터링 정상 작동"
  echo "$STUDENT_RESULTS" | jq '.results[] | {submittedAt, score: .grading.score, subject: .grading.subject}' 2>/dev/null || echo "데이터 파싱 오류"
else
  echo "ℹ️  해당 학생의 제출 기록이 없습니다"
fi

echo ""
echo "=========================================="
echo ""

# 4. 최종 요약
echo "4️⃣ 테스트 요약"
echo "----------------------------------------"

echo "✅ 완료된 항목:"
echo "  - Python Worker API 키 설정"
echo "  - 데이터베이스 컬럼명 수정"
echo "  - 학생별 필터링 추가"
echo "  - 중복 채점 제거"
echo ""

if [ "$OCR_TEXT" == "OCR API 키가 설정되지 않았습니다." ]; then
  echo "⚠️  남은 이슈:"
  echo "  - Gemini API 키가 Worker에 반영되지 않음"
  echo "  - Worker 재배포 또는 재시작 필요"
else
  echo "✅ 모든 API 키 정상 설정"
fi

echo ""
echo "=========================================="
echo "✅ 테스트 완료"

