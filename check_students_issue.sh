#!/bin/bash
echo "=== 🔍 학생 목록 표시 문제 진단 ==="
echo ""

echo "1️⃣ 최근 추가된 학생 확인 (DB에서 직접 조회):"
echo "   (최근 10명의 학생)"
echo ""

echo "2️⃣ API 응답 테스트 - ADMIN 권한:"
curl -s "https://superplacestudy.pages.dev/api/students?role=ADMIN" | jq '{
  success: .success,
  count: .count,
  message: .message,
  first_5_students: .students[:5] | map({
    id,
    name,
    email,
    academy_name,
    phone
  })
}'
echo ""

echo "3️⃣ API 응답 테스트 - 권한 없이 호출:"
curl -s "https://superplacestudy.pages.dev/api/students" | jq '.'
echo ""

echo "4️⃣ 학생 생성 API 로그 확인을 위한 테스트:"
echo "   새 학생을 추가해보고 목록에 나타나는지 확인이 필요합니다."
echo ""

echo "5️⃣ 프론트엔드 코드 확인 - 학생 목록 로드 방식:"
grep -A 10 "const loadStudents" src/app/dashboard/students/page.tsx | head -15
echo ""

echo "✅ 진단 완료"
echo ""
echo "📝 확인 필요 사항:"
echo "   1. localStorage에 저장된 user 정보의 role 확인"
echo "   2. API 호출 시 role 파라미터가 올바르게 전달되는지 확인"
echo "   3. 브라우저 콘솔 로그 확인"
