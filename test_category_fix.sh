#!/bin/bash

echo "======================================"
echo "카카오 채널 카테고리 수정 검증"
echo "======================================"
echo ""

echo "1️⃣  배포 상태 확인..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://superplacestudy.pages.dev/)
if [ "$RESPONSE" = "200" ]; then
  echo "✅ 사이트 정상 응답: HTTP $RESPONSE"
else
  echo "❌ 사이트 오류: HTTP $RESPONSE"
  exit 1
fi
echo ""

echo "2️⃣  Git 상태 확인..."
cd /home/user/webapp
CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo "✅ 현재 커밋: $CURRENT_COMMIT"
echo "✅ 브랜치: $(git branch --show-current)"
echo ""

echo "3️⃣  최근 커밋 로그 (최근 3개)..."
git log --oneline -3
echo ""

echo "4️⃣  수정된 파일 확인..."
if [ -f "src/app/dashboard/kakao-channel/register/page.tsx" ]; then
  echo "✅ 카테고리 등록 페이지 존재"
  
  # 중분류 즉시 설정 로직 확인
  if grep -q "setFinalCategoryCode(value);" src/app/dashboard/kakao-channel/register/page.tsx; then
    echo "✅ 중분류 즉시 설정 로직 확인됨"
  else
    echo "❌ 중분류 설정 로직 미확인"
  fi
  
  # 소분류 선택사항 확인
  if grep -q "소분류 (선택사항)" src/app/dashboard/kakao-channel/register/page.tsx; then
    echo "✅ 소분류 선택사항 UI 확인됨"
  else
    echo "❌ 소분류 선택사항 UI 미확인"
  fi
else
  echo "❌ 카테고리 등록 페이지 파일 없음"
  exit 1
fi
echo ""

echo "5️⃣  문서 파일 확인..."
DOCS=(
  "KAKAO_CHANNEL_FIX.md"
  "FULL_CATEGORIES_ADDED.md"
  "CATEGORY_SELECTION_FIX.md"
  "CATEGORY_AUTO_COMPLETE_SUMMARY.md"
  "KAKAO_CHANNEL_FINAL_VERIFICATION.md"
  "CATEGORY_FIX_FINAL.md"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo "✅ $doc"
  else
    echo "⚠️  $doc (없음)"
  fi
done
echo ""

echo "======================================"
echo "✅ 모든 검증 완료!"
echo "======================================"
echo ""
echo "📍 테스트 URL:"
echo "   https://superplacestudy.pages.dev/dashboard/kakao-channel/register"
echo ""
echo "🧪 테스트 시나리오:"
echo "   1. 대분류: 교육 선택"
echo "   2. 중분류: 학원 선택"
echo "   3. 확인: '✅ 선택된 카테고리: 002001' 표시"
echo "   4. '다음 단계' 버튼 클릭"
echo ""
echo "🔍 브라우저 콘솔 확인:"
echo "   - F12 → Console 탭"
echo "   - '📤 Sending create channel request:' 로그"
echo "   - categoryCode: '002001' 확인"
echo ""
