#!/bin/bash

echo "=========================================="
echo "🔧 결제 승인 메뉴 강제 재배포"
echo "=========================================="

# 1. 타임스탬프 추가 (캐시 무효화용)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo ""
echo "📝 타임스탬프 추가: $TIMESTAMP"

# 관리자 대시보드 페이지에 타임스탬프 주석 추가
sed -i "1a// Force redeploy: $TIMESTAMP - Payment Approval Menu Fix" src/app/dashboard/admin/page.tsx

echo ""
echo "✅ 타임스탬프 추가 완료"

# 2. 빌드
echo ""
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

# 3. Git 커밋 및 푸시
echo ""
echo "=========================================="
echo "📦 Git 커밋 및 푸시"
echo "=========================================="

git add -A
git commit -m "force: 결제 승인 메뉴 강제 재배포 (타임스탬프: $TIMESTAMP)"
git push origin main

echo ""
echo "=========================================="
echo "✅ 배포 완료"
echo "=========================================="
echo ""
echo "🌐 배포 URL: https://superplacestudy.pages.dev"
echo ""
echo "⏰ 배포 반영 예상 시간: 약 2-3분"
echo ""
echo "🔄 테스트 방법:"
echo "   1. 브라우저에서 Ctrl+Shift+R (또는 Cmd+Shift+R) 강제 새로고침"
echo "   2. https://superplacestudy.pages.dev/login 로그인"
echo "   3. 대시보드 → 관리자 메뉴 → 결제 승인 메뉴 확인"
echo ""

