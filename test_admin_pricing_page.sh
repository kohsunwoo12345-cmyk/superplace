#!/bin/bash

echo "=================================================="
echo "관리자 요금제 페이지 - API 테스트"
echo "=================================================="
echo ""

API_BASE="https://superplacestudy.pages.dev/api"

echo "📋 GET $API_BASE/admin/pricing"
echo "요금제 목록 조회 (새 구독 시스템)"
echo ""

curl -s "$API_BASE/admin/pricing" | jq '{
  success: .success,
  plans: .plans | length,
  planNames: .plans | map(.name),
  stats: .stats | map({planName, activeAcademies}),
  firstPlan: .plans[0] | {
    id,
    name,
    description,
    monthlyPrice,
    yearlyPrice,
    maxStudents,
    maxHomeworkChecks,
    maxAIAnalysis,
    maxSimilarProblems,
    maxLandingPages,
    features: .features | length
  }
}'

echo ""
echo "=================================================="
echo "✅ 확인 사항:"
echo "   - plans 배열에 4개 플랜 존재"
echo "   - Free, Starter, Pro, Enterprise 이름"
echo "   - stats에 각 플랜별 활성 학원 수"
echo "   - features 배열에 기능 목록"
echo "=================================================="
