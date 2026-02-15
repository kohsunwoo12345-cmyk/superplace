#!/bin/bash

# 이메일 패턴으로 학생 찾기
EMAIL_PATTERN="student_01085328_"

echo "=== D1 데이터베이스에서 학생 조회 ==="
echo ""
echo "이메일 패턴: ${EMAIL_PATTERN}*"
echo ""
echo "쿼리: SELECT id, name, email, phone, school, grade, diagnostic_memo, password FROM users WHERE email LIKE '%${EMAIL_PATTERN}%' AND role = 'STUDENT';"
echo ""
echo "⚠️ 이 쿼리를 Cloudflare D1 콘솔에서 실행해주세요:"
echo ""
echo "1. Cloudflare Dashboard → D1 → superplace DB 선택"
echo "2. Console 탭 클릭"
echo "3. 아래 쿼리 실행:"
echo ""
cat << 'SQL'
SELECT 
  id, 
  name, 
  email, 
  phone, 
  school, 
  grade, 
  diagnostic_memo,
  password,
  academy_id,
  created_at
FROM users 
WHERE email LIKE '%student_01085328_%' 
  AND role = 'STUDENT'
ORDER BY id DESC
LIMIT 5;
SQL

