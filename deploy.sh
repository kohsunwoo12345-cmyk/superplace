#!/bin/bash

# 자동 배포 스크립트
# 사용법: ./deploy.sh "커밋 메시지"

set -e

echo "🚀 자동 배포 시작..."

# 커밋 메시지 확인
if [ -z "$1" ]; then
  echo "❌ 커밋 메시지가 필요합니다."
  echo "사용법: ./deploy.sh \"커밋 메시지\""
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
git checkout genspark_ai_developer
git merge main -m "sync: Auto-merge from main"
git push origin genspark_ai_developer

# 7. main 브랜치로 복귀
git checkout main

# 8. GitHub Actions 대기
echo ""
echo "⏳ GitHub Actions 배포 대기 중 (10초)..."
sleep 10

# 9. GitHub Actions 상태 확인
echo ""
echo "📊 최근 배포 상태:"
gh run list --limit 2

echo ""
echo "✅ GitHub Actions 배포 완료!"
echo ""

# Vercel 자동 승격 시도
echo "🎯 Vercel Production 승격 시도 중..."
echo ""

if [ -n "$VERCEL_TOKEN" ]; then
  echo "✅ VERCEL_TOKEN 발견! 자동 승격 실행..."
  sleep 30  # 배포 완료 대기
  ./promote-to-production.sh
else
  echo "⚠️  VERCEL_TOKEN이 설정되지 않아 자동 승격을 건너뜁니다."
  echo ""
  echo "📋 수동 승격 방법:"
  echo "  1. Vercel Dashboard 접속: https://vercel.com/dashboard"
  echo "  2. superplace 프로젝트 선택"
  echo "  3. Deployments 탭"
  echo "  4. 최신 배포 [...] → 'Promote to Production'"
  echo ""
  echo "💡 자동 승격을 원하시면:"
  echo "  export VERCEL_TOKEN='your_vercel_token'"
fi

echo ""
echo "🌐 배포 완료 후 확인:"
echo "  https://superplace-study.vercel.app"
echo ""
