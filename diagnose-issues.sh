#!/bin/bash
echo "============================================"
echo "🔍 출석 통계 및 숙제 채점 진단"
echo "============================================"
echo ""

echo "⏳ 배포 대기 (60초)..."
sleep 60

echo ""
echo "==========================================  ="
echo "1️⃣ 출석 데이터베이스 확인"
echo "============================================"
echo ""

DB_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/admin/check-attendance-v3")
echo "📊 attendance_records_v3 테이블 상태:"
echo "$DB_RESPONSE" | jq '{
  success,
  tableExists,
  totalRecords,
  recentRecordsCount: (.recentRecords | length),
  message
}'

TOTAL_RECORDS=$(echo "$DB_RESPONSE" | jq -r '.totalRecords // 0')
echo ""
if [ "$TOTAL_RECORDS" -eq 0 ]; then
    echo "❌ 문제: attendance_records_v3 테이블에 데이터가 없습니다!"
    echo ""
    echo "📝 해결 방법:"
    echo "   1. 학생이 출석 체크인을 한 번도 하지 않음"
    echo "   2. 테이블이 비어있음"
    echo "   3. 출석 체크인 기능 테스트 필요"
    echo ""
    echo "🔧 조치사항:"
    echo "   - 학생 계정으로 로그인"
    echo "   - 출석 체크인 페이지 접속"
    echo "   - 출석 코드 입력하여 출석 생성"
else
    echo "✅ 출석 기록 존재: ${TOTAL_RECORDS}건"
    echo ""
    echo "📅 최근 출석 기록 (최대 3건):"
    echo "$DB_RESPONSE" | jq -r '.recentRecords[0:3] | .[] | "  - userId: \(.userId), 날짜: \(.date), 상태: \(.status)"'
    echo ""
    echo "👥 사용자별 통계:"
    echo "$DB_RESPONSE" | jq -r '.userStats[0:5] | .[] | "  - userId \(.userId): \(.recordCount)건 (첫 기록: \(.firstRecord))"'
fi

echo ""
echo "============================================"
echo "2️⃣ 숙제 채점 설정 확인"
echo "============================================"
echo ""

CONFIG_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
echo "⚙️ 현재 채점 설정:"
echo "$CONFIG_RESPONSE" | jq '{
  success,
  model: .config.model,
  temperature: .config.temperature,
  enableRAG: .config.enableRAG,
  promptLength: (.config.systemPrompt | length)
}'

CURRENT_MODEL=$(echo "$CONFIG_RESPONSE" | jq -r '.config.model')
echo ""
echo "🤖 선택된 모델: $CURRENT_MODEL"

if [[ "$CURRENT_MODEL" == "deepseek"* ]]; then
    echo "   ✅ DeepSeek 모델 설정됨"
    echo "   필요한 환경변수: DEEPSEEK_API_KEY"
elif [[ "$CURRENT_MODEL" == "gemini"* ]]; then
    echo "   ✅ Gemini 모델 설정됨"
    echo "   필요한 환경변수: GOOGLE_GEMINI_API_KEY"
fi

echo ""
echo "============================================"
echo "3️⃣ 숙제 채점 실제 테스트"
echo "============================================"
echo ""

echo "📝 테스트 숙제 제출..."
SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
    -H "Content-Type: application/json" \
    -d '{
        "userId": 1,
        "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
    }')

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id')
echo "✅ 제출 ID: $SUBMISSION_ID"
echo ""

echo "⏳ 백그라운드 채점 대기 (10초)..."
sleep 10

echo "📊 채점 결과 확인..."
STATUS_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/status/$SUBMISSION_ID")
GRADING_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status // "unknown"')

echo "   상태: $GRADING_STATUS"

if [ "$GRADING_STATUS" = "graded" ]; then
    echo "   ✅ 채점 완료!"
    echo "$STATUS_RESPONSE" | jq '{
      status,
      score: .grading.score,
      subject: .grading.subject,
      model: .grading.gradedBy
    }'
elif [ "$GRADING_STATUS" = "pending" ]; then
    echo "   ⚠️ 아직 채점 중... (추가 대기 필요)"
    echo ""
    echo "   수동 채점 트리거 시도..."
    MANUAL_GRADE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/process-grading" \
        -H "Content-Type: application/json" \
        -d "{\"submissionId\": \"$SUBMISSION_ID\"}")
    
    echo "   결과:"
    echo "$MANUAL_GRADE" | jq '.'
else
    echo "   ❌ 예상치 못한 상태: $GRADING_STATUS"
    echo "$STATUS_RESPONSE" | jq '.'
fi

echo ""
echo "============================================"
echo "📋 최종 진단 요약"
echo "============================================"
echo ""

if [ "$TOTAL_RECORDS" -eq 0 ]; then
    echo "❌ 출석 통계 문제: 출석 기록 없음"
    echo "   → 학생이 출석 체크인을 한 번도 하지 않음"
    echo "   → 출석 체크인 페이지에서 출석 생성 필요"
else
    echo "✅ 출석 통계: 정상 ($TOTAL_RECORDS 건)"
fi

if [ "$GRADING_STATUS" = "graded" ]; then
    echo "✅ 숙제 채점: 정상 작동 ($CURRENT_MODEL)"
else
    echo "⚠️ 숙제 채점: 확인 필요 (상태: $GRADING_STATUS)"
fi

echo ""
echo "🔗 관련 URL:"
echo "   출석 통계: https://superplacestudy.pages.dev/dashboard/attendance-statistics/"
echo "   숙제 채점 설정: https://superplacestudy.pages.dev/dashboard/admin/homework-grading-config/"
echo "   출석 체크인: https://superplacestudy.pages.dev/attendance-verify"
echo ""
echo "============================================"
