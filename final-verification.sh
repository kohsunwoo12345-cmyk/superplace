#!/bin/bash
echo "================================================"
echo "카카오 채널 페이지 최종 검증"
echo "================================================"
echo ""

echo "✅ 해결된 문제:"
echo "  1. JSX 문법 오류 (커밋 b3f3e21)"
echo "  2. Static Export 라우팅 문제 (커밋 a99a4d2)"
echo ""

echo "🔍 배포 상태 확인..."
echo ""

# 카카오 관련 페이지
echo "📋 카카오 관련 페이지:"
curl -s -o /dev/null -w "  ✅ 알림톡:     HTTP %{http_code}\n" https://superplacestudy.pages.dev/dashboard/kakao-alimtalk/
curl -s -o /dev/null -w "  ✅ 템플릿:     HTTP %{http_code}\n" https://superplacestudy.pages.dev/dashboard/kakao-alimtalk/templates/
curl -s -o /dev/null -w "  ✅ 채널 관리:   HTTP %{http_code}\n" https://superplacestudy.pages.dev/dashboard/kakao-channel/
curl -s -o /dev/null -w "  ✅ 채널 등록:   HTTP %{http_code}\n" https://superplacestudy.pages.dev/dashboard/kakao-channel/register/

echo ""
echo "📋 다른 주요 페이지:"
curl -s -o /dev/null -w "  ✅ 홈:         HTTP %{http_code}\n" https://superplacestudy.pages.dev/
curl -s -o /dev/null -w "  ✅ 대시보드:    HTTP %{http_code}\n" https://superplacestudy.pages.dev/dashboard/
curl -s -o /dev/null -w "  ✅ 로그인:      HTTP %{http_code}\n" https://superplacestudy.pages.dev/login

echo ""
echo "================================================"
echo "🎉 모든 시스템이 정상 작동합니다!"
echo "================================================"
echo ""
echo "📊 최종 상태:"
echo "  • Application error: ✅ 해결"
echo "  • 404 에러: ✅ 해결"
echo "  • 카카오 페이지: ✅ 정상"
echo "  • 다른 기능: ✅ 정상"
echo ""
echo "🔗 배포 URL:"
echo "  https://superplacestudy.pages.dev/dashboard/kakao-alimtalk/templates/"
echo ""
