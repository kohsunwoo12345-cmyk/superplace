#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "================================"
echo "🔧 출석 코드 생성 및 테스트"
echo "================================"
echo ""

echo "1️⃣ 고선우 학생용 출석 코드 생성"
echo "----------------------------"
gosunwoo_code=$(curl -s -X POST "${BASE_URL}/api/attendance/code" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 157,
    "academyId": 1,
    "classId": "test-class"
  }')
echo "$gosunwoo_code" | jq '.'
code_value=$(echo "$gosunwoo_code" | jq -r '.code')
echo ""
echo "생성된 출석 코드: $code_value"
echo ""

if [ -z "$code_value" ] || [ "$code_value" = "null" ]; then
  echo "❌ 출석 코드 생성 실패!"
  exit 1
fi

echo "2️⃣ 출석 체크인"
echo "----------------------------"
checkin_result=$(curl -s -X POST "${BASE_URL}/api/attendance/checkin" \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"$code_value\"}")
echo "$checkin_result" | jq '.'
success=$(echo "$checkin_result" | jq -r '.success')
echo ""

if [ "$success" = "true" ]; then
  echo "✅ 출석 체크인 성공!"
else
  error=$(echo "$checkin_result" | jq -r '.error')
  echo "❌ 출석 체크인 실패: $error"
fi
echo ""

echo "3️⃣ 출석 후 확인 (5초 대기)"
echo "----------------------------"
sleep 5

dashboard=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=157&academyId=1.0")
echo "$dashboard" | jq '{attendanceDays, studyHours}'
dashboard_days=$(echo "$dashboard" | jq -r '.attendanceDays')
echo ""
echo "출석일: ${dashboard_days}일"
