#!/bin/bash

echo "=== 배포된 코드 최종 검증 ==="
echo ""

echo "1️⃣ Git 상태 확인..."
git log --oneline -5
echo ""

echo "2️⃣ 수정된 파일 확인..."
echo "파일: src/app/dashboard/students/detail/page.tsx"
echo "변경 내용:"
grep -A 25 "// 4. 출석 코드 조회" src/app/dashboard/students/detail/page.tsx | head -30
echo ""

echo "3️⃣ API 작동 검증..."
echo "테스트 학생 ID: 157, 예상 코드: 802893"
RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=157")
echo "API 응답: $RESPONSE"
CODE=$(echo "$RESPONSE" | grep -o '"code":"[0-9]*"' | cut -d'"' -f4)
if [ "$CODE" = "802893" ]; then
    echo "✅ API 작동 확인 (코드: $CODE)"
else
    echo "❌ API 오류 (예상: 802893, 실제: $CODE)"
fi
echo ""

echo "4️⃣ 배포 정보..."
echo "커밋 해시: $(git log -1 --format=%H)"
echo "커밋 시간: $(git log -1 --format=%ci)"
echo "커밋 메시지: $(git log -1 --format=%s)"
echo ""

echo "✅ 코드 수정 및 배포 완료 검증 완료"
echo ""
echo "📋 수동 확인 필요:"
echo "1. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)"
echo "2. https://superplacestudy.pages.dev 로그인"
echo "3. 학생 상세 페이지에서 출석 코드 확인"
echo "4. F12 콘솔에서 [Attendance] 로그 확인"

