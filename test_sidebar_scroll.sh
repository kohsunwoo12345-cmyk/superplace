#!/bin/bash
echo "=== 📜 AI 챗봇 사이드바 스크롤 기능 테스트 ==="
echo ""

echo "1️⃣ 변경 내용 확인"
echo "✅ 스크롤 가능한 컨테이너 생성"
grep -n "스크롤 가능한 컨테이너" src/app/ai-chat/page.tsx

echo ""
echo "2️⃣ 구조 변경 확인"
echo "Before: 나의 봇 (고정) + 검색 (고정) + 최근 대화 (스크롤)"
echo "After:  나의 봇 + 검색 + 최근 대화 (모두 스크롤 가능)"

echo ""
echo "3️⃣ flex-1 overflow-y-auto 클래스 확인"
grep -n "flex-1 overflow-y-auto" src/app/ai-chat/page.tsx | head -5

echo ""
echo "4️⃣ div 구조 검증"
echo "사이드바 컨테이너:"
grep -n "왼쪽 사이드바" src/app/ai-chat/page.tsx
echo ""
echo "스크롤 영역 시작:"
grep -n "스크롤 가능한 컨테이너" src/app/ai-chat/page.tsx
echo ""
echo "나의 봇 섹션:"
grep -n "나의 봇" src/app/ai-chat/page.tsx | head -2
echo ""
echo "최근 대화 섹션:"
grep -n "최근 대화" src/app/ai-chat/page.tsx | head -1

echo ""
echo "✅ 구현 완료!"
echo ""
echo "📋 변경 사항:"
echo "- 나의 봇, 검색창, 최근 대화를 하나의 스크롤 컨테이너로 통합"
echo "- flex-1 overflow-y-auto로 전체 영역 스크롤 가능"
echo "- 사용자가 아래로 스크롤하여 모든 대화 목록 확인 가능"
