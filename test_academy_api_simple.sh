#!/bin/bash

API_BASE="https://superplacestudy.pages.dev/api"

echo "=================================================="
echo "학원 목록 조회 - 요금제 정보 확인"
echo "=================================================="
echo ""

# 학원 목록 조회
echo "📋 GET $API_BASE/admin/academies"
echo ""

curl -s -X GET "$API_BASE/admin/academies" \
  -H "Content-Type: application/json" | jq '{
  success: .success,
  total: .total,
  academies: .academies | map({
    id: .id,
    name: .name,
    studentCount: .studentCount,
    subscriptionPlan: .subscriptionPlan,
    currentPlan: .currentPlan | {
      name: .name,
      maxStudents: .maxStudents,
      usedStudents: .usedStudents,
      maxHomeworkChecks: .maxHomeworkChecks,
      usedHomeworkChecks: .usedHomeworkChecks,
      daysRemaining: .daysRemaining,
      isActive: .isActive
    }
  })
}'

echo ""
echo "=================================================="
echo "✅ 확인 사항:"
echo "   - subscriptionPlan 필드 존재"
echo "   - currentPlan 객체 존재"
echo "   - 사용량/제한 정보 표시"
echo "=================================================="
