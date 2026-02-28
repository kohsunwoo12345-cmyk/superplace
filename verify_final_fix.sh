#!/bin/bash

echo "=== 카카오 채널 카테고리 필수 선택 최종 검증 ==="
echo ""

# 1. Git 상태 확인
echo "📦 Git 상태:"
git log --oneline -3

echo ""
echo "🔍 변경된 파일:"
git show --stat HEAD

echo ""
echo "📋 현재 브랜치:"
git branch --show-current

echo ""

# 2. 배포 상태 확인
echo "🌐 배포 상태 확인:"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://superplacestudy.pages.dev/)
echo "라이브 사이트: https://superplacestudy.pages.dev/"
echo "상태 코드: $HTTP_STATUS"

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ 배포 성공!"
else
    echo "❌ 배포 오류 ($HTTP_STATUS)"
fi

echo ""

# 3. 카테고리 등록 페이지 확인
echo "📝 카테고리 등록 페이지:"
echo "https://superplacestudy.pages.dev/dashboard/kakao-channel/register"

echo ""

# 4. 코드 검증
echo "🔧 백엔드 검증 (functions/api/kakao/create-channel.ts):"
if grep -q "!categoryCode" functions/api/kakao/create-channel.ts; then
    echo "✅ categoryCode 필수 검증 확인"
else
    echo "❌ categoryCode 필수 검증 없음"
fi

echo ""
echo "🎨 프론트엔드 검증 (src/app/dashboard/kakao-channel/register/page.tsx):"
if grep -q "!finalCategoryCode" src/app/dashboard/kakao-channel/register/page.tsx; then
    echo "✅ finalCategoryCode 필수 검증 확인"
else
    echo "❌ finalCategoryCode 필수 검증 없음"
fi

if grep -q "카테고리 선택 (필수)" src/app/dashboard/kakao-channel/register/page.tsx; then
    echo "✅ UI 텍스트 '카테고리 선택 (필수)' 확인"
else
    echo "❌ UI 텍스트 '카테고리 선택 (필수)' 없음"
fi

echo ""

# 5. 문서 확인
echo "📄 생성된 문서:"
ls -lh CATEGORY_REQUIRED_FINAL_FIX.md 2>/dev/null && echo "✅ CATEGORY_REQUIRED_FINAL_FIX.md" || echo "❌ 문서 없음"

echo ""
echo "=== 검증 완료 ==="
echo ""
echo "🎯 테스트 URL:"
echo "https://superplacestudy.pages.dev/dashboard/kakao-channel/register"
echo ""
echo "📝 테스트 시나리오:"
echo "1. 대분류 '교육' 선택"
echo "2. 중분류 '학원' 선택"
echo "3. '✅ 선택된 카테고리: CS02' 확인"
echo "4. Step 2로 진행하여 채널 등록 완료"
