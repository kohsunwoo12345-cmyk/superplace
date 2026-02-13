#!/bin/bash

echo "=========================================="
echo "🔧 학원장 대시보드에서 결제 승인 메뉴 제거"
echo "=========================================="

# 1. 타임스탬프 추가
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo ""
echo "📝 타임스탬프: $TIMESTAMP"

# 2. 변경 사항 요약
echo ""
echo "=========================================="
echo "📋 변경 사항"
echo "=========================================="
echo ""
echo "❌ 학원장(DIRECTOR) 대시보드:"
echo "   - '관리 메뉴' 카드 완전 제거"
echo "   - 결제 승인 메뉴 제거"
echo ""
echo "✅ 관리자(ADMIN/SUPER_ADMIN) 대시보드:"
echo "   - '관리 메뉴' 카드 유지"
echo "   - 결제 승인 메뉴 유지"
echo ""
echo "🎯 권한 정책:"
echo "   ADMIN/SUPER_ADMIN → 관리 메뉴 ✅ (결제 승인 포함)"
echo "   DIRECTOR          → 관리 메뉴 ❌"
echo "   TEACHER           → 관리 메뉴 ❌"
echo "   STUDENT           → 관리 메뉴 ❌"
echo ""

# 3. 빌드
echo "=========================================="
echo "🔨 프로젝트 빌드"
echo "=========================================="

npm run build

if [ $? -ne 0 ]; then
  echo "❌ 빌드 실패"
  exit 1
fi

echo ""
echo "✅ 빌드 성공"

# 4. Git 커밋 및 푸시
echo ""
echo "=========================================="
echo "📦 Git 커밋 및 푸시"
echo "=========================================="

git add -A
git commit -m "fix: 학원장 대시보드에서 관리 메뉴 제거 - 관리자 전용으로 제한 (타임스탬프: $TIMESTAMP)"
git push origin main

echo ""
echo "=========================================="
echo "✅ 배포 완료"
echo "=========================================="
echo ""
echo "🌐 배포 URL: https://superplacestudy.pages.dev/dashboard"
echo ""
echo "⏰ 배포 반영 예상 시간: 약 2-3분"
echo ""
echo "🔄 테스트 방법:"
echo "   1. 학원장 계정으로 로그인 (admin@superplace.com)"
echo "   2. https://superplacestudy.pages.dev/dashboard 접속"
echo "   3. 페이지 하단 확인:"
echo "      • '관리 메뉴' 카드 없음 ✅"
echo "      • '결제 승인' 메뉴 없음 ✅"
echo ""
echo "   4. 관리자 계정으로 로그인 후 /dashboard 접속"
echo "   5. '관리 메뉴' 카드 및 '결제 승인' 메뉴 확인 ✅"
echo ""

