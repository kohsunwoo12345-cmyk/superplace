#!/bin/bash

echo "=========================================="
echo "🔍 최종 시스템 검증"
echo "=========================================="
echo ""

BASE_URL="https://superplacestudy.pages.dev"

# 1. 환경 변수 확인
echo "1️⃣ 환경 변수 확인..."
DEBUG=$(curl -s "${BASE_URL}/api/homework/debug")
echo "$DEBUG" | jq '{
  hasNovitaApiKey: .environment.hasNovitaApiKey,
  novitaKeyLength: .environment.novitaKeyLength,
  novitaKeyPrefix: .environment.novitaKeyPrefix,
  hasGeminiApiKey: .environment.hasGeminiApiKey
}'
echo ""

# 2. 채점 설정 확인
echo "2️⃣ 채점 설정 확인..."
CONFIG=$(curl -s "${BASE_URL}/api/admin/homework-grading-config")
echo "$CONFIG" | jq '{
  model: .config.model,
  temperature: .config.temperature,
  enableRAG: .config.enableRAG,
  promptLength: (.config.systemPrompt | length)
}'
echo ""

# 3. 출석 API 확인
echo "3️⃣ 출석 API 확인..."
ATT=$(curl -s "${BASE_URL}/api/attendance/statistics?userId=student-1772865101424-12ldfjns29zg&role=STUDENT")
echo "$ATT" | jq '{
  success: .success,
  role: .role,
  attendanceDays: .attendanceDays,
  hasCalendar: (.calendar != null)
}'
echo ""

# 4. 출석 페이지 HTML 확인
echo "4️⃣ 출석 페이지 확인..."
PAGE=$(curl -s "${BASE_URL}/dashboard/attendance-statistics/" | head -c 1000)
if echo "$PAGE" | grep -q "AttendanceStatistics\|출석"; then
  echo "✅ 출석 페이지 로드됨"
else
  echo "❌ 출석 페이지 컴포넌트 없음"
fi
echo ""

echo "=========================================="
echo "완료"
echo "=========================================="
