#!/bin/bash

# =========================================
# 출석 코드 문제 완전 해결 스크립트
# =========================================

echo "========================================"
echo "🔧 출석 코드 문제 해결 스크립트"
echo "========================================"
echo ""

# 배포 URL
BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "📋 실행 방법을 선택하세요:"
echo ""
echo "Option 1: API 호출 (권장)"
echo "   → 브라우저에서 다음 URL을 열기:"
echo "   → ${BASE_URL}/api/admin/activate-all-codes"
echo ""
echo "Option 2: Cloudflare D1 Console에서 직접 SQL 실행"
echo "   1. https://dash.cloudflare.com 접속"
echo "   2. Workers & Pages → D1 → superplace-db 선택"
echo "   3. Console 탭 클릭"
echo "   4. 다음 SQL 복사해서 실행:"
echo ""
echo "   -- 모든 코드 활성화"
echo "   UPDATE student_attendance_codes SET isActive = 1;"
echo ""
echo "   -- 결과 확인"
echo "   SELECT COUNT(*) as active FROM student_attendance_codes WHERE isActive = 1;"
echo ""
echo "Option 3: 스크립트로 자동 호출 (curl 필요)"
echo ""

read -p "Option 3을 실행하시겠습니까? (y/N): " choice

if [[ "$choice" == "y" || "$choice" == "Y" ]]; then
  echo ""
  echo "🚀 API 호출 중..."
  echo ""
  
  response=$(curl -s "${BASE_URL}/api/admin/activate-all-codes")
  
  if echo "$response" | grep -q '"success":.*true'; then
    echo "✅ 성공!"
    echo ""
    echo "$response" | python3 -m json.tool
    echo ""
    echo "========================================"
    echo "✅ 모든 출석 코드가 활성화되었습니다!"
    echo "========================================"
  else
    echo "❌ 실패"
    echo ""
    echo "응답:"
    echo "$response"
    echo ""
    echo "⚠️ API가 아직 배포되지 않았을 수 있습니다."
    echo "   Option 2 (D1 Console)를 사용해주세요."
  fi
else
  echo ""
  echo "ℹ️ Option 1 또는 Option 2를 수동으로 실행해주세요."
fi

echo ""
echo "========================================"
echo "📝 테스트 방법"
echo "========================================"
echo ""
echo "1. 학생 관리 페이지:"
echo "   ${BASE_URL}/dashboard/students/"
echo "   → 학생 클릭 → 출석 코드 확인"
echo ""
echo "2. 출석 인증 페이지:"
echo "   ${BASE_URL}/attendance-verify/"
echo "   → 코드 입력 → '출석 처리되었습니다!' 확인"
echo ""
echo "3. 브라우저 콘솔 확인 (F12):"
echo "   → Console 탭에서 응답 데이터 확인"
echo ""
echo "========================================"
echo "🔗 추가 리소스"
echo "========================================"
echo ""
echo "- SQL 스크립트: scripts/fix-attendance-codes.sql"
echo "- 가이드 문서: ATTENDANCE_FIX_INSTRUCTIONS.md"
echo "- GitHub PR: https://github.com/kohsunwoo12345-cmyk/superplace/pull/7"
echo ""
