#!/bin/bash

echo "=========================================="
echo "💳 학원장 대시보드에 결제 승인 메뉴 추가"
echo "=========================================="

# 1. 타임스탬프 추가
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo ""
echo "📝 타임스탬프 추가: $TIMESTAMP"

sed -i "2a// Force redeploy: $TIMESTAMP - Add Payment Menu to Director Dashboard" src/app/dashboard/page.tsx

echo ""
echo "✅ 학원장 대시보드에 관리 메뉴 추가 완료"

# 2. 변경 사항 확인
echo ""
echo "=========================================="
echo "🔍 변경 사항 확인"
echo "=========================================="

echo ""
echo "결제 승인 메뉴 존재 여부:"
grep -c "결제 승인" src/app/dashboard/page.tsx
echo "개 발견"

# 3. 빌드
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

# 4. Git 커밋 및 푸시
echo ""
echo "=========================================="
echo "📦 Git 커밋 및 푸시"
echo "=========================================="

git add -A
git commit -m "feat: 학원장(DIRECTOR) 대시보드에 관리 메뉴 및 결제 승인 추가 (타임스탬프: $TIMESTAMP)"
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
echo "📋 추가된 내용:"
echo "   • 학원장 대시보드 하단에 '관리 메뉴' 카드 추가"
echo "   • 4개 버튼 그리드 레이아웃:"
echo "     - 사용자 관리"
echo "     - 학원 관리"
echo "     - AI 봇 관리"
echo "     - 💳 결제 승인 (새로 추가!)"
echo ""
echo "🔄 테스트 방법:"
echo "   1. 브라우저에서 Ctrl+Shift+R (또는 Cmd+Shift+R) 강제 새로고침"
echo "   2. https://superplacestudy.pages.dev/login 로그인 (학원장 계정)"
echo "   3. https://superplacestudy.pages.dev/dashboard 접속"
echo "   4. 페이지 하단의 '관리 메뉴' 카드에서 '💳 결제 승인' 버튼 확인"
echo ""

