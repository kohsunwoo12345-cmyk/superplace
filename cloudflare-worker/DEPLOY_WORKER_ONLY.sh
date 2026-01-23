#!/bin/bash

echo "🚀 Cloudflare Worker 배포 스크립트"
echo "===================================="
echo ""
echo "⚠️  주의: 이것은 Cloudflare Pages가 아닌 Worker 배포입니다!"
echo ""

# 패키지 설치
echo "📦 1. 패키지 설치 중..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 패키지 설치 실패"
    exit 1
fi

echo "✅ 패키지 설치 완료"
echo ""

# Wrangler 로그인
echo "🔐 2. Cloudflare 로그인..."
echo "   브라우저가 열리면 로그인하세요"
wrangler login

if [ $? -ne 0 ]; then
    echo "❌ 로그인 실패"
    exit 1
fi

echo "✅ 로그인 완료"
echo ""

# Worker 배포
echo "🚀 3. Worker 배포 중..."
wrangler deploy

if [ $? -ne 0 ]; then
    echo "❌ 배포 실패"
    exit 1
fi

echo ""
echo "🎉 배포 완료!"
echo ""
echo "📝 다음 단계:"
echo "1. 위에 출력된 Worker URL을 복사하세요"
echo "2. Vercel 환경 변수에 추가하세요:"
echo "   - CLOUDFLARE_WORKER_URL=복사한_URL"
echo "   - CLOUDFLARE_WORKER_TOKEN=92629e6aa16f35aaae63ace77625575860327f664844c4d60871cc8897cce1f3"
echo ""
