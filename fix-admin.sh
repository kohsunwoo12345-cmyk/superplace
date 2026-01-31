#!/bin/bash

# Vercel 프로덕션 데이터베이스 자동 수정 스크립트

echo "=================================="
echo "🔧 Vercel 데이터베이스 수정 도구"
echo "=================================="
echo ""

# Vercel 프로젝트 확인
if [ ! -f ".vercel/project.json" ]; then
    echo "⚠️  Vercel 프로젝트가 연결되지 않았습니다."
    echo ""
    echo "다음 명령어를 실행하세요:"
    echo "  npx vercel link"
    echo ""
    exit 1
fi

echo "📥 Vercel 환경 변수 가져오는 중..."
npx vercel env pull .env.production --yes 2>/dev/null

if [ ! -f ".env.production" ]; then
    echo "❌ 환경 변수를 가져올 수 없습니다."
    echo ""
    echo "수동으로 DATABASE_URL을 입력하세요:"
    read -p "DATABASE_URL: " DATABASE_URL
    
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL이 비어있습니다."
        exit 1
    fi
    
    echo "DATABASE_URL=$DATABASE_URL" > .env.production
fi

echo "✅ 환경 변수 로드 완료"
echo ""

# .env.production에서 DATABASE_URL 추출
export $(cat .env.production | grep DATABASE_URL | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL을 찾을 수 없습니다."
    exit 1
fi

echo "🔗 데이터베이스 연결 중..."
echo "   호스트: $(echo $DATABASE_URL | sed -E 's|.*@([^:]+):.*|\1|')"
echo ""

# fix-admin.js 실행
node fix-admin.js

# 정리
echo ""
echo "🧹 임시 파일 정리 중..."
rm -f .env.production

echo ""
echo "✅ 완료!"
