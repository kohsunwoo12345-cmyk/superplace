#!/bin/bash

echo "==================================================="
echo "🔍 배포 상태 및 실제 코드 확인"
echo "==================================================="

# 1. 최신 커밋 확인
echo ""
echo "1️⃣ 로컬 Git 상태"
echo "---------------------------------------------------"
git log --oneline -1
echo ""
git status

# 2. 배포된 페이지에서 실제 JavaScript 코드 확인
echo ""
echo "2️⃣ 배포된 사이트의 실제 코드 확인"
echo "---------------------------------------------------"
echo "페이지 다운로드 중..."

# AI 봇 할당 페이지 HTML 다운로드
curl -s "https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign" > /tmp/assign_page.html

# HTML에서 JavaScript 번들 URL 추출
BUNDLE_URL=$(grep -o '/_next/static/chunks/app/dashboard/admin/ai-bots/assign/page-[^"]*\.js' /tmp/assign_page.html | head -1)

if [ -n "$BUNDLE_URL" ]; then
    echo "JavaScript 번들 URL: $BUNDLE_URL"
    
    # JavaScript 파일 다운로드 및 권한 체크 코드 검색
    echo ""
    echo "JavaScript 파일 다운로드 중..."
    curl -s "https://superplacestudy.pages.dev${BUNDLE_URL}" > /tmp/bundle.js
    
    echo ""
    echo "권한 체크 코드 검색 결과:"
    echo "---------------------------------------------------"
    
    # "접근 권한이 없습니다" 문자열 검색
    if grep -q "접근 권한이 없습니다" /tmp/bundle.js; then
        echo "❌ 발견: '접근 권한이 없습니다' 메시지가 여전히 존재"
        echo ""
        echo "관련 코드:"
        grep -o ".{0,100}접근 권한이 없습니다.{0,100}" /tmp/bundle.js | head -3
    else
        echo "✅ 확인: '접근 권한이 없습니다' 메시지 없음"
    fi
    
    echo ""
    
    # allowedRoles 검색
    if grep -q "allowedRoles" /tmp/bundle.js; then
        echo "❌ 발견: allowedRoles 체크 코드가 여전히 존재"
        echo ""
        echo "관련 코드:"
        grep -o ".{0,100}allowedRoles.{0,100}" /tmp/bundle.js | head -3
    else
        echo "✅ 확인: allowedRoles 체크 코드 없음"
    fi
else
    echo "❌ JavaScript 번들을 찾을 수 없습니다"
    echo ""
    echo "HTML 내용 확인:"
    head -50 /tmp/assign_page.html
fi

echo ""
echo "3️⃣ 로컬 파일의 현재 코드 확인"
echo "---------------------------------------------------"
grep -A 5 "로그인한 모든 사용자" src/app/dashboard/admin/ai-bots/assign/page.tsx || echo "❌ 수정된 코드가 로컬에 없습니다"

echo ""
echo "==================================================="
echo "✅ 확인 완료"
echo "==================================================="

