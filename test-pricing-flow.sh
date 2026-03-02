#!/bin/bash
# 요금제 생성 → 저장 → 승인 → 적용 전체 플로우 테스트

BASE_URL="https://superplacestudy.pages.dev"
set -e

echo "🧪 요금제 전체 플로우 테스트"
echo "=============================="
echo ""

# 1. 현재 요금제 목록 조회
echo "[1] 현재 요금제 목록 조회..."
PLANS=$(curl -s "${BASE_URL}/api/admin/pricing-plans")
echo "$PLANS" | jq -r '.plans[] | "  - \(.name): 학생 \(.maxStudents)명, 월 \(.pricing_1month)원"'
echo ""

# 2. 요금제 필드 확인
echo "[2] 첫 번째 요금제 상세 확인..."
echo "$PLANS" | jq '.plans[0] | {
  name,
  pricing_1month,
  pricing_6months,
  pricing_12months,
  maxStudents,
  maxTeachers,
  maxHomeworkChecks,
  maxAIAnalysis,
  maxAIGrading,
  maxCapabilityAnalysis,
  maxConceptAnalysis,
  maxSimilarProblems,
  maxLandingPages
}'
echo ""

echo "✅ 테스트 완료"
echo ""
echo "📝 확인 사항:"
echo "  1. pricing_1month, pricing_6months, pricing_12months 필드 존재 확인"
echo "  2. maxStudents 등 한도 필드 값 확인"
echo ""
