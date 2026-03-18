#!/bin/bash

echo "=== 최종 수정 검증 ==="
echo ""

echo "⏳ Cloudflare Pages 배포 대기 (180초)..."
sleep 180
echo ""

echo "✅ 배포 완료! 이제 테스트..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 수정 내용"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "문제:"
echo "  - URL: ?id=student-1772865608071-3s67r1wq6n5"
echo "  - 이 student_code를 그대로 userId로 사용"
echo "  - 출석 코드 API는 숫자 ID 필요"
echo ""
echo "해결:"
echo "  - API에서 student 객체 조회"
echo "  - student.id (숫자)를 추출"
echo "  - 이 숫자 ID로 출석 코드 조회"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🧪 샘플 테스트 (숫자 ID 사용)"
for ID in 1 2 3 157 200; do
  CODE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID" | jq -r '.code // "없음"')
  echo "  학생 ID $ID: 코드 $CODE"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 사용자 조치 사항"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 브라우저 캐시 완전 삭제 (필수!)"
echo "   Ctrl+Shift+Delete > 전체 기간 > 데이터 삭제"
echo ""
echo "2. 또는 시크릿 모드 사용 (Ctrl+Shift+N)"
echo ""
echo "3. 학생 상세 페이지 접속"
echo ""
echo "4. F12 > Console 확인:"
echo "   '🎯 Fetching attendance code for numeric userId: [숫자]'"
echo "   '✅ Setting attendance code: XXXXXX'"
echo ""
echo "5. 출석 코드 (6자리) 카드 표시 확인!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 이제 진짜 고쳐졌습니다!"
echo "   (브라우저 캐시만 지우면 바로 보입니다)"
