#!/bin/bash

# CloudFlare Pages 데이터베이스 동기화 긴급 체크

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 CloudFlare Pages 데이터베이스 동기화 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "배포 URL:"
echo "  Vercel:      https://superplace-study.vercel.app/"
echo "  CloudFlare:  https://superplace-academy.pages.dev/"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 체크리스트
echo "📋 즉시 확인할 사항:"
echo ""
echo "1️⃣ Vercel DATABASE_URL 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ① Vercel Dashboard 접속:"
echo "      https://vercel.com/dashboard"
echo ""
echo "   ② superplace 프로젝트 → Settings → Environment Variables"
echo ""
echo "   ③ DATABASE_URL 찾기 → 👁️ Show 클릭 → 전체 복사"
echo ""
echo "   예시:"
echo "   postgres://default:xxx@ep-xxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
echo ""
read -p "   ✅ DATABASE_URL을 복사했습니까? (y/n): " vercel_copied
echo ""

if [ "$vercel_copied" != "y" ]; then
    echo "   ⚠️  먼저 Vercel DATABASE_URL을 복사하세요!"
    exit 1
fi

echo "2️⃣ CloudFlare Pages 환경 변수 설정"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ① CloudFlare Dashboard 접속:"
echo "      https://dash.cloudflare.com/"
echo ""
echo "   ② Workers & Pages → superplace-academy → Settings"
echo ""
echo "   ③ Environment variables 섹션으로 스크롤"
echo ""
read -p "   ✅ CloudFlare 환경 변수 페이지에 있습니까? (y/n): " cf_page
echo ""

if [ "$cf_page" != "y" ]; then
    echo "   ⚠️  CloudFlare Dashboard에서 Environment variables 페이지로 이동하세요!"
    exit 1
fi

echo "3️⃣ DATABASE_URL 상태 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   CloudFlare Pages에 DATABASE_URL이 있습니까?"
echo ""
echo "   [1] 없음 (새로 추가해야 함)"
echo "   [2] 있음 (값 확인 필요)"
echo ""
read -p "   선택 (1 또는 2): " db_status
echo ""

if [ "$db_status" = "1" ]; then
    echo "   📝 DATABASE_URL 추가 방법:"
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "   ① Add variable 버튼 클릭"
    echo ""
    echo "   ② Variable name 입력:"
    echo "      DATABASE_URL"
    echo ""
    echo "   ③ Value 입력:"
    echo "      [Vercel에서 복사한 DATABASE_URL 전체 붙여넣기]"
    echo ""
    echo "   ④ Environment:"
    echo "      ✅ Production (체크)"
    echo ""
    echo "   ⑤ Save 클릭"
    echo ""
    read -p "   ✅ DATABASE_URL을 추가했습니까? (y/n): " db_added
    
elif [ "$db_status" = "2" ]; then
    echo "   🔍 DATABASE_URL 값 비교:"
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "   CloudFlare의 DATABASE_URL이 Vercel과 정확히 동일합니까?"
    echo ""
    echo "   확인 사항:"
    echo "   - 시작부터 끝까지 완전히 동일"
    echo "   - ?sslmode=require 포함"
    echo "   - 공백이나 줄바꿈 없음"
    echo ""
    read -p "   CloudFlare과 Vercel의 DATABASE_URL이 동일합니까? (y/n): " db_same
    echo ""
    
    if [ "$db_same" != "y" ]; then
        echo "   ✏️ DATABASE_URL 수정 방법:"
        echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "   ① DATABASE_URL 오른쪽의 Edit 버튼 클릭"
        echo ""
        echo "   ② Value 수정:"
        echo "      [기존 값 전체 삭제]"
        echo "      [Vercel DATABASE_URL 붙여넣기]"
        echo ""
        echo "   ③ Save 클릭"
        echo ""
        read -p "   ✅ DATABASE_URL을 수정했습니까? (y/n): " db_updated
    fi
fi

echo ""
echo "4️⃣ 다른 환경 변수 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   CloudFlare Pages에 다음 변수들이 설정되어 있습니까?"
echo ""
echo "   ① NEXTAUTH_URL"
echo "      값: https://superplace-academy.pages.dev"
echo "      ⚠️ Vercel과 달라야 함!"
echo ""
read -p "   ✅ NEXTAUTH_URL 확인 완료? (y/n): " nextauth_url_ok
echo ""

echo "   ② NEXTAUTH_SECRET"
echo "      값: [Vercel과 동일한 값]"
echo ""
read -p "   ✅ NEXTAUTH_SECRET 확인 완료? (y/n): " nextauth_secret_ok
echo ""

echo "   ③ GOOGLE_GEMINI_API_KEY"
echo "      값: [Vercel과 동일한 값]"
echo ""
read -p "   ✅ GOOGLE_GEMINI_API_KEY 확인 완료? (y/n): " gemini_ok
echo ""

echo "   ④ GEMINI_API_KEY"
echo "      값: [GOOGLE_GEMINI_API_KEY와 동일]"
echo ""
read -p "   ✅ GEMINI_API_KEY 확인 완료? (y/n): " gemini2_ok
echo ""

echo "5️⃣ 재배포 (필수!)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   환경 변수를 추가/수정했으므로 재배포가 필요합니다."
echo ""
echo "   ① Deployments 탭 클릭"
echo ""
echo "   ② 최신 배포(맨 위)의 ⋯ 메뉴 클릭"
echo ""
echo "   ③ Retry deployment 선택"
echo ""
echo "   ④ 빌드 완료 대기 (2-3분)"
echo ""
read -p "   ✅ 재배포를 완료했습니까? (y/n): " redeployed
echo ""

if [ "$redeployed" != "y" ]; then
    echo "   ⚠️  환경 변수 변경 후 반드시 재배포해야 합니다!"
    exit 1
fi

echo "6️⃣ 동기화 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   배포가 완료되었으면 다음을 테스트하세요:"
echo ""
echo "   테스트 1: Vercel 계정으로 CloudFlare 로그인"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ① https://superplace-academy.pages.dev/auth/signin"
echo "   ② Vercel에서 사용하던 이메일/비밀번호로 로그인"
echo "   ③ 로그인 성공 = 동기화 완료!"
echo ""
read -p "   ✅ 로그인 성공했습니까? (y/n): " login_ok
echo ""

if [ "$login_ok" = "y" ]; then
    echo "   🎉 축하합니다! 데이터베이스 동기화 완료!"
    echo ""
    echo "   테스트 2: 관리자 페이지에서 사용자 목록 비교"
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "   ① Vercel:      https://superplace-study.vercel.app/dashboard/admin/users"
    echo "   ② CloudFlare:  https://superplace-academy.pages.dev/dashboard/admin/users"
    echo ""
    read -p "   ✅ 두 페이지에서 동일한 사용자 목록이 표시됩니까? (y/n): " users_same
    echo ""
    
    if [ "$users_same" = "y" ]; then
        echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "   ✨ 완벽합니다! 실시간 동기화 성공! ✨"
        echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "   이제 다음이 가능합니다:"
        echo "   • CloudFlare에서 회원가입 → Vercel에서 로그인 ✅"
        echo "   • Vercel에서 학원 생성 → CloudFlare에서 확인 ✅"
        echo "   • 모든 데이터 실시간 양방향 동기화 ✅"
        echo ""
    else
        echo "   ⚠️  사용자 목록이 다릅니다. DATABASE_URL을 다시 확인하세요."
    fi
else
    echo "   ❌ 로그인 실패 - 문제 해결 필요"
    echo ""
    echo "   📋 확인 사항:"
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "   ① CloudFlare DATABASE_URL = Vercel DATABASE_URL (완전히 동일)"
    echo "   ② NEXTAUTH_URL = https://superplace-academy.pages.dev"
    echo "   ③ NEXTAUTH_SECRET = Vercel과 동일"
    echo "   ④ 재배포 완료"
    echo "   ⑤ 브라우저 캐시 삭제 (Ctrl+Shift+Delete)"
    echo ""
    echo "   상세 가이드: URGENT_SYNC_FIX.md"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "체크 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
