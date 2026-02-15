#!/bin/bash

echo "=== 학생 Sjss 정확한 ID 찾기 ==="
echo ""

# 방법 1: 타임스탬프로 추정 (1771126812909 = 2026-02-15 11:46:52 GMT)
echo "1️⃣ 타임스탬프 1771126812909 근처 학생 찾기..."
echo "이메일 패턴: student_01085328_1771126812909@temp.student.local"
echo ""

# ID 160-180 범위 검색 (타임스탬프로 추정)
echo "2️⃣ ID 160-180 범위에서 Sjss 찾기..."
for ID in {160..180}; do
  RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/admin/users/${ID}" 2>&1)
  NAME=$(echo "$RESPONSE" | jq -r '.user.name // empty' 2>/dev/null)
  PHONE=$(echo "$RESPONSE" | jq -r '.user.phone // empty' 2>/dev/null)
  EMAIL=$(echo "$RESPONSE" | jq -r '.user.email // empty' 2>/dev/null)
  
  # Sjss 이름 또는 01085328 전화번호 또는 해당 타임스탬프 이메일 찾기
  if [[ "$NAME" == "Sjss" ]] || [[ "$PHONE" == *"01085328"* ]] || [[ "$EMAIL" == *"1771126812909"* ]]; then
    echo "✅ 찾았습니다! ID: $ID"
    echo "$RESPONSE" | jq '{
      id: .user.id,
      name: .user.name,
      phone: .user.phone,
      email: .user.email,
      school: .user.school,
      grade: .user.grade,
      diagnostic_memo: .user.diagnostic_memo,
      password: .user.password,
      academy_id: .user.academyId,
      created_at: .user.createdAt
    }'
    echo ""
    echo "🔧 이 ID로 강제 업데이트 실행:"
    echo "https://superplacestudy.pages.dev/api/students/force-update?id=${ID}&school=서울고등학교&grade=고2&diagnosticMemo=테스트"
    echo ""
    
    # 발견 시 종료
    exit 0
  fi
done

echo "❌ ID 160-180 범위에서 찾지 못했습니다."
echo ""
echo "📋 더 넓은 범위 검색 필요..."

