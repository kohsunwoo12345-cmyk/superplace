#!/bin/bash

# Vercel Production Branch 자동 설정 확인 스크립트

echo "🔍 Vercel 배포 상태 진단 중..."
echo ""

# 1. GitHub Actions 상태
echo "📊 GitHub Actions 상태:"
gh run list --limit 1 --json status,conclusion,displayTitle | jq -r '.[] | "Status: \(.status) | Conclusion: \(.conclusion) | Title: \(.displayTitle)"'

echo ""

# 2. 최신 배포 ETag
echo "🌐 Production 사이트 상태:"
ETAG=$(curl -sI https://superplace-study.vercel.app/dashboard | grep -i "etag:" | cut -d' ' -f2)
AGE=$(curl -sI https://superplace-study.vercel.app/dashboard | grep -i "age:" | cut -d' ' -f2)

echo "  ETag: $ETAG"
echo "  Age: $AGE seconds"

if [ "$AGE" -lt 300 ]; then
  echo "  ✅ 최근 배포됨 (5분 이내)"
else
  echo "  ⚠️  오래된 배포 ($(($AGE / 60))분 전)"
fi

echo ""
echo "🔧 문제 진단:"
echo ""

# 3. Deploy Hook 확인
if [ -n "$AGE" ] && [ "$AGE" -lt 300 ]; then
  echo "✅ GitHub Actions → Vercel Deploy Hook 작동 중"
  echo "✅ 새 배포가 생성되고 있음"
  echo ""
  echo "⚠️  하지만 Preview 배포만 생성되고 있을 가능성:"
  echo ""
  echo "📋 해결 방법:"
  echo ""
  echo "1. Vercel Dashboard 접속:"
  echo "   https://vercel.com/dashboard"
  echo ""
  echo "2. superplace 프로젝트 선택"
  echo ""
  echo "3. Settings → Git → Production Branch"
  echo ""
  echo "4. Production Branch 설정:"
  echo "   - 현재: 확인 필요"
  echo "   - 변경: 'genspark_ai_developer' 또는 'main'"
  echo ""
  echo "5. Save 클릭"
  echo ""
  echo "💡 설정 후:"
  echo "   - Deploy Hook이 자동으로 Production 배포 생성"
  echo "   - 수동 승격 불필요"
  echo "   - 완전 자동 배포 완성!"
else
  echo "❌ 배포가 오래 전에 진행됨"
  echo ""
  echo "가능한 원인:"
  echo "  1. Deploy Hook URL이 잘못됨"
  echo "  2. Vercel 빌드 실패"
  echo "  3. GitHub Secret 설정 오류"
  echo ""
  echo "확인 방법:"
  echo "  1. https://github.com/kohsunwoo12345-cmyk/superplace/settings/secrets/actions"
  echo "  2. VERCEL_DEPLOY_HOOK_URL 확인"
  echo "  3. https://vercel.com/dashboard → Settings → Git → Deploy Hooks"
fi

echo ""
echo "🌐 현재 사이트 확인:"
echo "  https://superplace-study.vercel.app"
echo ""
echo "📊 Vercel Dashboard:"
echo "  https://vercel.com/dashboard"
echo ""
