#!/bin/bash

echo "=== 학생 Sjss 문제 진단 시작 ==="
echo ""

# 1. 전화번호로 학생 찾기
echo "1️⃣ 전화번호 01085328로 학생 검색..."
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/students" 2>&1)
echo "API 응답:"
echo "$RESPONSE" | jq '.'
echo ""

# 2. 최근 생성된 학생들 확인
echo "2️⃣ 최근 생성 학생 확인 (ID 190-192)..."
for ID in 190 191 192; do
  echo "--- 학생 ID: $ID ---"
  curl -s "https://superplacestudy.pages.dev/api/admin/users/${ID}" | jq '{
    id: .user.id,
    name: .user.name,
    phone: .user.phone,
    email: .user.email,
    school: .user.school,
    grade: .user.grade,
    diagnostic_memo: .user.diagnostic_memo,
    password: .user.password
  }'
  echo ""
done

# 3. 강제 업데이트 API 테스트
echo "3️⃣ 강제 업데이트 API 사용 가능 여부 확인..."
curl -s "https://superplacestudy.pages.dev/api/students/force-update" | jq '.'
echo ""

echo "=== 진단 완료 ==="
echo ""
echo "📋 다음 정보를 확인하세요:"
echo "1. API 응답에서 학생 목록이 비어있나요?"
echo "2. 학생 ID 190-192 중 어느 것이 Sjss인가요?"
echo "3. school, grade 값이 null인가요?"

