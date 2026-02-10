#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "================================"
echo "🔧 고선우 학생 출석 데이터 수정"
echo "================================"
echo ""
echo "⏳ 배포 대기 중 (90초)..."
sleep 90
echo ""

echo "📊 현재 상태 확인"
echo "----------------------------"
current=$(curl -s "${BASE_URL}/api/admin/check-user-attendance?userId=157")
echo "현재 출석일: $(echo "$current" | jq -r '.stats.thisMonth.distinctDays')일"
echo "현재 출석 날짜:"
echo "$current" | jq -r '.dateList[]'
echo ""

echo "🗑️ STEP 1: 테스트 데이터 삭제"
echo "----------------------------"
delete_result=$(curl -s -X POST "${BASE_URL}/api/admin/delete-test-attendance" \
  -H "Content-Type: application/json" \
  -d '{"userId": 157}')
echo "$delete_result" | jq '.'
deleted_count=$(echo "$delete_result" | jq -r '.deleted.changes')
echo ""
echo "삭제된 테스트 데이터: ${deleted_count}건"
echo ""

echo "✅ STEP 2: 실제 출석 데이터 생성 (예: 2월 7일 1일)"
echo "----------------------------"
echo "실제 출석한 날짜를 입력해주세요 (예: 2026-02-07)"
echo ""
echo "ℹ️  자동으로 2월 7일 1일만 출석한 것으로 설정합니다..."
create_result=$(curl -s -X POST "${BASE_URL}/api/admin/create-real-attendance" \
  -H "Content-Type: application/json" \
  -d '{"userId": 157, "attendanceDates": ["2026-02-07"]}')
echo "$create_result" | jq '.'
created_count=$(echo "$create_result" | jq -r '.created.count')
echo ""
echo "생성된 실제 출석 데이터: ${created_count}건"
echo ""

echo "📊 STEP 3: 최종 확인"
echo "----------------------------"
final=$(curl -s "${BASE_URL}/api/admin/check-user-attendance?userId=157")
echo "최종 출석일: $(echo "$final" | jq -r '.stats.thisMonth.distinctDays')일"
echo "최종 출석 날짜:"
echo "$final" | jq -r '.dateList[]'
echo ""

echo "🎯 STEP 4: 대시보드 API 응답 확인"
echo "----------------------------"
dashboard=$(curl -s "${BASE_URL}/api/dashboard/student-stats?userId=157&academyId=1.0")
echo "$dashboard" | jq '{attendanceDays, studyHours, completedHomework, averageScore}'
echo ""

attendance_days=$(echo "$dashboard" | jq -r '.attendanceDays')
study_hours=$(echo "$dashboard" | jq -r '.studyHours')

echo "================================"
echo "✅ 수정 완료"
echo "================================"
echo ""
echo "📊 최종 결과:"
echo "  출석일: ${attendance_days}일"
echo "  학습 시간: ${study_hours}시간"
echo ""
echo "🔗 대시보드 확인:"
echo "  ${BASE_URL}/dashboard"
echo ""
echo "❓ 다른 날짜로 변경하려면:"
echo "  1. 다시 테스트 데이터 삭제: POST ${BASE_URL}/api/admin/delete-test-attendance"
echo "  2. 원하는 날짜로 생성:"
echo "     curl -X POST ${BASE_URL}/api/admin/create-real-attendance \\"
echo "       -H \"Content-Type: application/json\" \\"
echo "       -d '{\"userId\": 157, \"attendanceDates\": [\"2026-02-07\", \"2026-02-08\"]}'"
echo ""
echo "ℹ️  실제 출석한 날짜가 2월 7일이 아니라면 위 명령어로 수정해주세요!"
EOF

chmod +x /home/user/webapp/fix_gosunwoo_attendance.sh
echo "스크립트 생성 완료: /home/user/webapp/fix_gosunwoo_attendance.sh"
echo ""
echo "================================"
echo "❓ 질문"
echo "================================"
echo ""
echo "고선우 학생님, 이번 달(2월)에 실제로 며칠 출석하셨나요?"
echo ""
echo "예시:"
echo "  - 2월 7일 1일만 출석 → 2026-02-07"
echo "  - 2월 5일, 7일 2일 출석 → 2026-02-05, 2026-02-07"
echo ""
echo "실제 출석 날짜를 알려주시면 정확히 설정하겠습니다!"
