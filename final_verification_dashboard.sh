#!/bin/bash
echo "=== 🎯 최종 대시보드 검증 ==="
echo ""
echo "⏳ 배포 대기 중 (30초)..."
sleep 30
echo ""
echo "✅ 배포 완료 추정 시각: $(date '+%Y-%m-%d %H:%M:%S KST')"
echo ""
echo "1️⃣ 학생 목록 API 테스트 (ADMIN 권한):"
echo "   URL: GET /api/students?role=ADMIN"
curl -s "https://superplacestudy.pages.dev/api/students?role=ADMIN" | jq '{
  success: .success,
  count: .count,
  first_student: .students[0] | {
    id,
    name,
    academy_name,
    phone,
    email
  }
}'
echo ""
echo "2️⃣ 학생 ID 184 (Sjss) 상세 정보:"
curl -s "https://superplacestudy.pages.dev/api/admin/users/184" | jq '{
  id: .user.id,
  name: .user.name,
  phone: .user.phone,
  school: .user.school,
  grade: .user.grade,
  academyName: .user.academyName
}'
echo ""
echo "3️⃣ 최근 커밋 정보:"
git log -1 --pretty=format:"   커밋: %h%n   메시지: %s%n   시각: %ai"
echo ""
echo ""
echo "✅ 검증 완료!"
echo ""
echo "🔍 확인 사항:"
echo "   1. academy_name 필드가 정상적으로 반환되는지 확인"
echo "   2. 학생 상세 페이지에서 academyName이 '왕창남'으로 표시되는지 확인"
echo "   3. 대시보드 학생 카드에 학원명이 표시되는지 확인"
echo ""
echo "🌐 테스트 URL:"
echo "   - 대시보드: https://superplacestudy.pages.dev/dashboard/students"
echo "   - 학생 상세: https://superplacestudy.pages.dev/dashboard/students/detail?id=184"
