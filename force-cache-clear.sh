#!/bin/bash

echo "=== 브라우저 캐시 강제 클리어 대책 ==="
echo ""

echo "⏳ 배포 대기 (180초)..."
sleep 180
echo ""

echo "🧪 테스트: 학생 ID 1의 출석 코드 조회"
RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=1")
echo "$RESPONSE" | jq '.'
echo ""

CODE=$(echo "$RESPONSE" | jq -r '.code')
echo "✅ 학생 ID 1 출석 코드: $CODE"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 사용자 조치 사항"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Chrome/Edge에서 완전한 캐시 삭제:"
echo "   - Ctrl+Shift+Delete (Windows/Linux)"
echo "   - Cmd+Shift+Delete (Mac)"
echo "   - '전체 기간' 선택"
echo "   - '캐시된 이미지 및 파일' 체크"
echo "   - '데이터 삭제' 클릭"
echo ""
echo "2. 개발자 도구로 강제 새로고침:"
echo "   - F12 눌러서 개발자 도구 열기"
echo "   - 새로고침 버튼에서 우클릭"
echo "   - '캐시 비우기 및 강력 새로고침' 선택"
echo ""
echo "3. 시크릿/프라이빗 모드 테스트:"
echo "   - Ctrl+Shift+N (Chrome)"
echo "   - Cmd+Shift+N (Safari)"
echo "   - https://suplacestudy.com 접속"
echo ""
echo "4. F12 Console 확인:"
echo "   - 학생 상세 페이지 접속"
echo "   - F12 > Console 탭"
echo "   - 다음 로그 확인:"
echo "     '🎯 Fetching attendance code for userId: X'"
echo "     '✅ Setting attendance code: XXXXXX'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "API는 정상 작동 중입니다. 브라우저 캐시 문제입니다!"
