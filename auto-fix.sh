#!/bin/bash

# DATABASE_URL 자동 감지 및 수정 스크립트

echo "🔍 DATABASE_URL 찾는 중..."

# 1. 환경 변수 확인
if [ ! -z "$DATABASE_URL" ]; then
    echo "✅ 환경 변수에서 DATABASE_URL 발견"
    node fix-admin.js "$DATABASE_URL"
    exit $?
fi

# 2. .env 파일 확인
if [ -f ".env" ] && grep -q "DATABASE_URL" .env; then
    echo "✅ .env 파일에서 DATABASE_URL 발견"
    source .env
    node fix-admin.js "$DATABASE_URL"
    exit $?
fi

# 3. .env.local 파일 확인
if [ -f ".env.local" ] && grep -q "DATABASE_URL" .env.local; then
    echo "✅ .env.local 파일에서 DATABASE_URL 발견"
    source .env.local
    node fix-admin.js "$DATABASE_URL"
    exit $?
fi

# 4. Vercel에서 가져오기 시도
echo "📥 Vercel에서 환경 변수 가져오기 시도..."
npx vercel env pull .env.temp --yes 2>/dev/null

if [ -f ".env.temp" ] && grep -q "DATABASE_URL" .env.temp; then
    echo "✅ Vercel에서 DATABASE_URL 가져오기 성공"
    source .env.temp
    node fix-admin.js "$DATABASE_URL"
    EXIT_CODE=$?
    rm -f .env.temp
    exit $EXIT_CODE
fi

# 5. 수동 입력
echo ""
echo "❌ DATABASE_URL을 찾을 수 없습니다."
echo ""
echo "대화형 모드로 실행합니다..."
echo ""
node run-fix.js
