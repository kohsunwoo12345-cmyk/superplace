#!/bin/bash
echo "=== 배포 검증 스크립트 ==="
echo ""
echo "1. 학생 ID 184 (Sjss) 정보 확인:"
curl -s "https://superplacestudy.pages.dev/api/admin/users/184" | jq '{
  id: .user.id,
  name: .user.name,
  phone: .user.phone,
  school: .user.school,
  grade: .user.grade,
  academyName: .user.academyName,
  diagnostic_memo: .user.diagnostic_memo
}'
echo ""
echo "2. 최근 배포 커밋 확인:"
git log -1 --oneline
echo ""
echo "3. 프론트엔드 파일 확인 - 학생 상세 페이지 QR 코드 제거 여부:"
grep -n "학생 식별 코드" src/app/dashboard/students/detail/page.tsx | head -5
echo ""
echo "4. API 응답 academyName 필드 확인:"
grep -n "academyName" functions/api/admin/users/\[id\].ts | head -10
