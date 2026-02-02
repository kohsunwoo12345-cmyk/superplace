#!/bin/bash

# Vercel 배포 상태 확인 스크립트
# 사용법: ./check-deployment.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Vercel 배포 상태 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 사이트 URL
SITE_URL="https://superplace-study.vercel.app"

echo "📍 사이트 URL: $SITE_URL"
echo ""

# HTTP 상태 확인
echo "1️⃣  HTTP 상태 코드 확인..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SITE_URL)
echo "   → 상태 코드: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ 사이트 정상 응답"
else
    echo "   ❌ 사이트 응답 오류"
fi
echo ""

# 헤더 정보 확인
echo "2️⃣  캐시 상태 확인..."
CACHE_AGE=$(curl -s -I $SITE_URL | grep -i "^age:" | awk '{print $2}' | tr -d '\r')
if [ -n "$CACHE_AGE" ]; then
    echo "   → 캐시 Age: ${CACHE_AGE}초"
    if [ "$CACHE_AGE" -lt 300 ]; then
        echo "   ✅ 최근 배포됨 (5분 이내)"
    else
        MINUTES=$((CACHE_AGE / 60))
        echo "   ⚠️  ${MINUTES}분 전 배포"
    fi
else
    echo "   → 캐시 정보 없음"
fi
echo ""

# Git 상태 확인
echo "3️⃣  Git 커밋 상태 확인..."
CURRENT_COMMIT=$(git log -1 --format="%h")
COMMIT_MESSAGE=$(git log -1 --format="%s")
echo "   → 최신 커밋: $CURRENT_COMMIT"
echo "   → 커밋 메시지: $COMMIT_MESSAGE"
echo ""

# 브랜치 확인
echo "4️⃣  브랜치 상태 확인..."
CURRENT_BRANCH=$(git branch --show-current)
echo "   → 현재 브랜치: $CURRENT_BRANCH"

# 원격 브랜치와 비교
git fetch origin --quiet
MAIN_COMMIT=$(git log origin/main -1 --format="%h")
DEV_COMMIT=$(git log origin/genspark_ai_developer -1 --format="%h")

echo "   → origin/main: $MAIN_COMMIT"
echo "   → origin/genspark_ai_developer: $DEV_COMMIT"

if [ "$MAIN_COMMIT" = "$DEV_COMMIT" ]; then
    echo "   ✅ 모든 브랜치 동기화됨"
else
    echo "   ⚠️  브랜치가 동기화되지 않음"
fi
echo ""

# 최근 푸시 시간
echo "5️⃣  최근 푸시 시간..."
LAST_PUSH=$(git log -1 --format="%ar")
echo "   → $LAST_PUSH"
echo ""

# 배포 대기 시간 안내
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 다음 단계"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Vercel 자동 배포 대기 (2-3분)"
echo "   → https://vercel.com/dashboard"
echo ""
echo "2. 배포 완료 후 브라우저 캐시 삭제"
echo "   → Ctrl + Shift + Delete"
echo ""
echo "3. 시크릿 모드로 사이트 접속"
echo "   → $SITE_URL/dashboard"
echo ""
echo "4. 관리자 로그인 후 확인"
echo "   → '최근 가입 사용자' 섹션 확인"
echo ""

# 재확인 명령어
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 1분 후 재확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "sleep 60 && ./check-deployment.sh"
echo ""
