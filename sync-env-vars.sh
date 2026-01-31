#!/bin/bash

# Vercel 환경 변수 확인 및 CloudFlare Pages 설정 가이드
# 
# 이 스크립트는 Vercel의 환경 변수를 가져와서 CloudFlare Pages에 설정하는 방법을 안내합니다.

echo "========================================="
echo "Vercel → CloudFlare Pages 환경 변수 동기화"
echo "========================================="
echo ""

# Vercel 환경 변수 가져오기
echo "1️⃣ Vercel 환경 변수 가져오는 중..."
echo ""

# Vercel 로그인 확인
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI가 설치되어 있지 않습니다."
    echo "설치: npm install -g vercel"
    exit 1
fi

echo "Vercel 로그인 중..."
vercel whoami > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "Vercel 로그인이 필요합니다."
    vercel login
fi

echo ""
echo "Vercel 환경 변수를 .env.vercel 파일로 저장 중..."
vercel env pull .env.vercel --yes

if [ $? -eq 0 ]; then
    echo "✅ Vercel 환경 변수 가져오기 성공!"
    echo ""
    echo "📋 Vercel 환경 변수 목록:"
    echo "========================================"
    cat .env.vercel
    echo "========================================"
else
    echo "❌ Vercel 환경 변수 가져오기 실패"
    exit 1
fi

echo ""
echo ""
echo "2️⃣ CloudFlare Pages 환경 변수 설정 방법"
echo "========================================"
echo ""
echo "다음 단계를 따라 CloudFlare Pages에 환경 변수를 설정하세요:"
echo ""
echo "1. CloudFlare Dashboard 접속:"
echo "   https://dash.cloudflare.com/"
echo ""
echo "2. Workers & Pages > superplace-study 프로젝트 선택"
echo ""
echo "3. Settings 탭 > Environment variables 클릭"
echo ""
echo "4. 다음 환경 변수들을 하나씩 추가:"
echo ""

# .env.vercel 파일에서 환경 변수 읽기
while IFS='=' read -r key value; do
    # 주석이나 빈 줄 건너뛰기
    if [[ ! $key =~ ^#.* ]] && [ -n "$key" ]; then
        # NEXTAUTH_URL은 CloudFlare 도메인으로 변경
        if [ "$key" = "NEXTAUTH_URL" ]; then
            echo "   📌 $key"
            echo "      Value: https://superplace-study.pages.dev"
            echo "      Environment: Production ✅"
            echo ""
        else
            echo "   📌 $key"
            echo "      Value: $value"
            echo "      Environment: Production ✅"
            echo ""
        fi
    fi
done < .env.vercel

echo ""
echo "⚠️  중요: NEXTAUTH_URL은 CloudFlare Pages 도메인으로 변경해야 합니다!"
echo "   Vercel: https://superplace-study.vercel.app"
echo "   CloudFlare: https://superplace-study.pages.dev"
echo ""

echo ""
echo "3️⃣ 환경 변수 설정 후 재배포"
echo "========================================"
echo ""
echo "1. CloudFlare Dashboard > Deployments 탭"
echo "2. 최신 배포의 ⋯ 메뉴 클릭"
echo "3. 'Retry deployment' 클릭"
echo "4. 빌드 완료 대기 (2-3분)"
echo ""

echo ""
echo "4️⃣ 동기화 확인"
echo "========================================"
echo ""
echo "배포 완료 후 다음 URL에서 동일한 사용자 데이터 확인:"
echo ""
echo "Vercel:      https://superplace-study.vercel.app/dashboard/admin/users"
echo "CloudFlare:  https://superplace-study.pages.dev/dashboard/admin/users"
echo ""
echo "✅ 동일한 사용자 목록이 표시되면 동기화 성공!"
echo ""

echo ""
echo "========================================="
echo "환경 변수 파일 저장 위치: .env.vercel"
echo "========================================="
