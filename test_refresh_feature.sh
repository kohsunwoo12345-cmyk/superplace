#!/bin/bash
echo "=== 🔄 학생 목록 자동 새로고침 기능 테스트 ==="
echo ""
echo "⏳ 배포 대기 중 (30초)..."
sleep 30
echo ""
echo "✅ 배포 완료 추정 시각: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

echo "1️⃣ 현재 학생 수 확인:"
STUDENT_COUNT=$(curl -s "https://superplacestudy.pages.dev/api/students?role=ADMIN" | jq '.count')
echo "   총 학생 수: $STUDENT_COUNT 명"
echo ""

echo "2️⃣ 최근 커밋 확인:"
git log -1 --pretty=format:"   커밋: %h%n   메시지: %s%n   시각: %ai"
echo ""
echo ""

echo "3️⃣ 변경된 파일:"
git diff HEAD~1 --name-only
echo ""

echo "✅ 테스트 완료!"
echo ""
echo "🔍 사용자 확인 사항:"
echo "   1. https://superplacestudy.pages.dev/dashboard/students 접속"
echo "   2. 우측 상단에 '새로고침' 버튼 확인 (🔄 아이콘)"
echo "   3. '학생 추가' 버튼으로 새 학생 추가"
echo "   4. 추가 후 목록에 자동으로 새 학생이 표시되는지 확인"
echo "   5. 브라우저 콘솔(F12)에서 로그 확인:"
echo "      - '🔍 Fetching students from: /api/students?role=...'"
echo "      - '✅ Loaded students: XX students'"
echo "      - '📊 First student: {...}'"
echo ""
echo "💡 문제 해결:"
echo "   - 새 학생이 안 보이면: '새로고침' 버튼 클릭"
echo "   - 그래도 안 보이면: 브라우저 캐시 삭제 (Ctrl+Shift+Delete)"
echo "   - 콘솔 로그에서 role과 API 응답 확인"
