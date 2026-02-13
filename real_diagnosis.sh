#!/bin/bash

echo "=========================================="
echo "🔍 실제 배포 상태 100% 정확한 진단"
echo "=========================================="

# 1. 현재 로컬 코드 확인
echo ""
echo "1️⃣ 로컬 파일의 실제 코드"
echo "----------------------------------------"
echo "src/app/dashboard/admin/ai-bots/assign/page.tsx 의 75-95줄:"
sed -n '75,95p' src/app/dashboard/admin/ai-bots/assign/page.tsx

# 2. 실제 배포된 HTML 다운로드
echo ""
echo "2️⃣ 실제 배포된 페이지 다운로드"
echo "----------------------------------------"
curl -s "https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign" > /tmp/real_page.html

# JavaScript 번들 파일 추출
BUNDLE_URL=$(grep -o '/_next/static/chunks/app/dashboard/admin/ai-bots/assign/page-[^"]*\.js' /tmp/real_page.html | head -1)

if [ -n "$BUNDLE_URL" ]; then
    echo "발견된 번들: $BUNDLE_URL"
    
    # 번들 다운로드
    curl -s "https://superplacestudy.pages.dev${BUNDLE_URL}" > /tmp/real_bundle.js
    
    BUNDLE_SIZE=$(wc -c < /tmp/real_bundle.js)
    echo "번들 크기: $BUNDLE_SIZE bytes"
    
    # 3. 실제 배포된 코드에서 "접근 권한" 검색
    echo ""
    echo "3️⃣ 배포된 코드에서 '접근 권한' 검색"
    echo "----------------------------------------"
    if grep -q "접근 권한이 없습니다" /tmp/real_bundle.js; then
        echo "❌❌❌ 발견됨! 아직도 OLD 코드가 배포되어 있음!"
        echo ""
        echo "발견된 내용:"
        grep -o ".{0,200}접근 권한이 없습니다.{0,200}" /tmp/real_bundle.js | head -3
    else
        echo "✅ 없음 - 새 코드가 배포되어 있음"
    fi
    
    # 4. allowedRoles 검색
    echo ""
    echo "4️⃣ 배포된 코드에서 'allowedRoles' 검색"
    echo "----------------------------------------"
    if grep -q "allowedRoles" /tmp/real_bundle.js; then
        echo "❌❌❌ 발견됨! allowedRoles 체크 코드가 여전히 있음!"
        echo ""
        echo "발견된 내용:"
        grep -o ".{0,150}allowedRoles.{0,150}" /tmp/real_bundle.js | head -3
    else
        echo "✅ 없음"
    fi
    
    # 5. 새 코드 확인
    echo ""
    echo "5️⃣ 새 코드 검색: '로그인한 모든 사용자'"
    echo "----------------------------------------"
    if grep -q "로그인한 모든 사용자" /tmp/real_bundle.js; then
        echo "✅ 발견됨! 새 코드가 배포되어 있음"
    else
        echo "❌❌❌ 없음! 새 코드가 배포 안됨!"
    fi
    
else
    echo "❌ JavaScript 번들을 찾을 수 없음"
    echo ""
    echo "HTML 내용:"
    head -100 /tmp/real_page.html
fi

# 6. Git 상태
echo ""
echo "6️⃣ 현재 Git 상태"
echo "----------------------------------------"
git log --oneline -3

echo ""
echo "7️⃣ Cloudflare Pages 빌드 상태 확인 필요"
echo "----------------------------------------"
echo "https://dash.cloudflare.com/ 에서 확인:"
echo "- Workers & Pages"
echo "- superplacestudy 프로젝트"
echo "- View builds"
echo "- 최신 빌드가 'Success'인지 확인"
echo "- 최신 커밋: 24fd630"

echo ""
echo "=========================================="
echo "🎯 진단 완료"
echo "=========================================="

