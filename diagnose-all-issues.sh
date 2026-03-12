#!/bin/bash

echo "=========================================="
echo "🔍 전체 시스템 정밀 진단"
echo "=========================================="
echo ""

BASE_URL="https://superplacestudy.pages.dev"

# 1. 최근 채점 결과 확인
echo "1️⃣ 최근 채점 결과 확인..."
RECENT_SUBMISSION="homework-1773309455302-s2tuzz4f0"
RESULT=$(curl -s "${BASE_URL}/api/homework/status/${RECENT_SUBMISSION}")

echo "점수: $(echo "$RESULT" | jq -r '.grading.score')"
echo "과목: $(echo "$RESULT" | jq -r '.grading.subject')"
echo "전체 문제: $(echo "$RESULT" | jq -r '.grading.totalQuestions')"
echo "정답 수: $(echo "$RESULT" | jq -r '.grading.correctAnswers')"
echo "피드백: $(echo "$RESULT" | jq -r '.grading.feedback')"
echo "문제 분석 개수: $(echo "$RESULT" | jq '.grading.problemAnalysis | length')"
echo "상세 분석: $(echo "$RESULT" | jq -r '.grading.detailedAnalysis')"
echo ""

# 2. RAG 설정 확인
echo "2️⃣ RAG 설정 확인..."
CONFIG=$(curl -s "${BASE_URL}/api/admin/homework-grading-config")
echo "enableRAG: $(echo "$CONFIG" | jq -r '.config.enableRAG')"
echo "knowledgeBase: $(echo "$CONFIG" | jq -r '.config.knowledgeBase')"
echo ""

# 3. Python Worker 테스트
echo "3️⃣ Python Worker 테스트..."
PYTHON_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
PYTHON_TEST=$(curl -s -X POST "${PYTHON_URL}/solve" \
  -H "Content-Type: application/json" \
  -d '{"equation": "2 + 3"}' 2>&1)

if echo "$PYTHON_TEST" | jq . > /dev/null 2>&1; then
  echo "✅ Python Worker 정상 작동"
  echo "$PYTHON_TEST" | jq '{success, result, equation}'
else
  echo "❌ Python Worker 오류:"
  echo "$PYTHON_TEST"
fi
echo ""

# 4. 출석 페이지 HTML 확인
echo "4️⃣ 출석 통계 페이지 확인..."
PAGE_HTML=$(curl -s "${BASE_URL}/dashboard/attendance-statistics/")
if echo "$PAGE_HTML" | grep -q "AttendanceStatistics" || echo "$PAGE_HTML" | grep -q "출석 통계"; then
  echo "✅ 출석 페이지 로드됨"
  
  # React component 확인
  if echo "$PAGE_HTML" | grep -q "__NEXT_DATA__"; then
    echo "✅ Next.js 데이터 포함됨"
  else
    echo "⚠️ Next.js 데이터 없음"
  fi
else
  echo "❌ 출석 페이지 컴포넌트 없음"
fi
echo ""

# 5. 실제 학생 출석 API 테스트
echo "5️⃣ 학생 출석 API 테스트..."
STUDENT_ID="student-1772865101424-12ldfjns29zg"
ATT=$(curl -s "${BASE_URL}/api/attendance/statistics?userId=${STUDENT_ID}&role=STUDENT")
echo "role: $(echo "$ATT" | jq -r '.role')"
echo "attendanceDays: $(echo "$ATT" | jq -r '.attendanceDays')"
echo "calendar keys: $(echo "$ATT" | jq -r '.calendar | keys | join(", ")')"
echo ""

echo "=========================================="
echo "진단 완료"
echo "=========================================="
