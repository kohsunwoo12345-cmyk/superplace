#!/bin/bash

# 완전 자동 배포 스크립트 (Vercel Production까지)
# 사용법: ./auto-deploy.sh "커밋 메시지"

set -e

echo "🚀 완전 자동 배포 시작..."

# 커밋 메시지 확인
if [ -z "$1" ]; then
  echo "❌ 커밋 메시지가 필요합니다."
  echo "사용법: ./auto-deploy.sh \"커밋 메시지\""
  exit 1
fi

COMMIT_MESSAGE="$1"

echo "📝 커밋 메시지: $COMMIT_MESSAGE"

# 1. 변경사항 확인
echo ""
echo "📊 변경된 파일:"
git status --short

# 2. 빌드 테스트
echo ""
echo "🔨 빌드 테스트 중..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ 빌드 성공!"
else
  echo "❌ 빌드 실패! 배포를 중단합니다."
  exit 1
fi

# 3. Git add
echo ""
echo "📦 파일 스테이징..."
git add -A

# 4. Commit
echo ""
echo "💾 커밋 생성..."
git commit -m "$COMMIT_MESSAGE"

# 5. main 브랜치로 푸시
echo ""
echo "🚀 main 브랜치에 푸시 중..."
git push origin main

# 6. genspark_ai_developer 브랜치 동기화
echo ""
echo "🔄 genspark_ai_developer 브랜치 동기화 중..."
CURRENT_BRANCH=$(git branch --show-current)
git checkout genspark_ai_developer
git merge main -m "sync: Auto-merge from main - $COMMIT_MESSAGE"
git push origin genspark_ai_developer

# 7. 원래 브랜치로 복귀
git checkout $CURRENT_BRANCH

# 8. GitHub Actions 배포 완료 대기
echo ""
echo "⏳ GitHub Actions 배포 대기 중 (90초)..."
sleep 90

# 9. GitHub Actions 상태 확인
echo ""
echo "📊 배포 상태 확인:"
gh run list --limit 1

# 10. Vercel Production 배포
echo ""
echo "🎯 Vercel Production 배포 시작..."
echo "📍 현재 디렉토리: $(pwd)"

# Vercel 프로젝트 연결 확인
if [ ! -f ".vercel/project.json" ]; then
  echo "⚠️  Vercel 프로젝트가 연결되지 않았습니다."
  echo "🔗 Vercel 연결 중..."
  
  # vercel link를 비대화형으로 실행
  echo "superplace" | npx vercel link --yes
fi

# Production 배포 실행
echo "🚀 Production 배포 실행 중..."
DEPLOY_OUTPUT=$(npx vercel --prod --yes 2>&1)
DEPLOY_EXIT_CODE=$?

echo "$DEPLOY_OUTPUT"

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Vercel Production 배포 완료!"
  
  # 배포 URL 추출
  DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^ ]*vercel.app' | head -1)
  
  if [ -n "$DEPLOY_URL" ]; then
    echo "🌐 배포 URL: $DEPLOY_URL"
  fi
else
  echo ""
  echo "⚠️  Vercel CLI 배포 실패 (Exit code: $DEPLOY_EXIT_CODE)"
  echo ""
  echo "📋 수동 승격이 필요할 수 있습니다:"
  echo "  1. https://vercel.com/dashboard"
  echo "  2. superplace 프로젝트 선택"
  echo "  3. Deployments 탭"
  echo "  4. 최신 배포 [...] → 'Promote to Production'"
fi

echo ""
echo "🎉 배포 프로세스 완료!"
echo ""
echo "🌐 사이트 확인:"
echo "  https://superplace-study.vercel.app"
echo ""
echo "📊 Vercel Dashboard:"
echo "  https://vercel.com/dashboard"
echo ""
