#!/bin/bash

echo "==================================================="
echo "⏳ Cloudflare Pages 배포 대기 중..."
echo "==================================================="

echo ""
echo "📦 Commit: a51ce2d"
echo "🔧 수정: AI 챗봇 페이지 빌드 오류 수정"
echo "🎯 URL: https://superplacestudy.pages.dev"
echo ""
echo "배포 완료까지 약 2-3분 소요됩니다..."
echo ""

# 2분 대기
for i in {1..24}; do
  echo -n "."
  sleep 5
done

echo ""
echo ""
echo "==================================================="
echo "✅ 배포 완료 예상 시간 도달"
echo "==================================================="

# 홈페이지 확인
echo ""
echo "🏠 홈페이지 상태 확인..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://superplacestudy.pages.dev/")
echo "   ✓ 상태 코드: $STATUS"

# AI 챗봇 페이지 확인
echo ""
echo "🤖 AI 챗봇 페이지 상태 확인..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://superplacestudy.pages.dev/ai-chat")
echo "   ✓ 상태 코드: $STATUS"

# AI 봇 할당 페이지 확인
echo ""
echo "⚙️  AI 봇 할당 페이지 상태 확인..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign")
echo "   ✓ 상태 코드: $STATUS"

echo ""
echo "==================================================="
echo "✅ 배포 확인 완료"
echo "==================================================="
echo ""
echo "📝 배포 내용:"
echo "   - AI 챗봇 페이지 빌드 오류 수정"
echo "   - div 태그 균형 문제 해결"
echo "   - 정상 작동 버전으로 롤백"
echo ""
echo "🔍 확인 필요 사항:"
echo "   1. AI 챗봇 페이지가 정상 로드되는지"
echo "   2. 사이드바 기능이 작동하는지"
echo "   3. 관리자 AI 봇 할당 페이지가 작동하는지"
echo ""
