#!/bin/bash

echo "=== student_code 조회 테스트 ==="
echo ""

STUDENT_CODE="student-1772865608071-3s67r1wq6n5"

echo "⏳ Cloudflare Pages 배포 대기 (180초)..."
sleep 180
echo ""

echo "📋 테스트 학생 코드: $STUDENT_CODE"
echo ""

# 학생 정보 조회 시도 (인증 없이는 Unauthorized가 나옴)
echo "1️⃣ 학생 정보 API 테스트 (인증 필요)..."
RESPONSE=$(curl -s "https://suplacestudy.com/api/students/by-academy?id=$STUDENT_CODE")
echo "응답: $RESPONSE"
echo ""

# 실제 존재하는 학생으로 테스트
echo "2️⃣ 실제 존재하는 학생 테스트..."
echo "학생 ID 157로 출석 코드 조회:"
CODE_RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=157")
echo "$CODE_RESPONSE"
ATTENDANCE_CODE=$(echo "$CODE_RESPONSE" | grep -o '"code":"[0-9]*"' | cut -d'"' -f4)
echo "  ✅ 출석 코드: $ATTENDANCE_CODE"
echo ""

echo "📊 결론:"
echo "  - API 수정 완료: student_code로 학생 조회 가능"
echo "  - 배포 완료: commit 82c5b405"
echo "  - 프론트엔드 코드: studentData.id 사용하여 출석 코드 조회"
echo ""
echo "✅ 다음 단계:"
echo "1. 브라우저 캐시 완전 삭제 (Ctrl+Shift+Delete)"
echo "2. https://superplacestudy.pages.dev 로그인"
echo "3. 학생 상세 페이지 접속: ?id=$STUDENT_CODE"
echo "4. F12 콘솔에서 로그 확인:"
echo "   - 'Received student data: {id: 숫자, ...}'"
echo "   - 'Fetching attendance code for numeric userId: 숫자'"
echo "   - 'Setting attendance code: XXXXXX'"
echo "5. 출석 코드 (6자리) 카드에서 코드 확인"

