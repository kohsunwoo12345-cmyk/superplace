#!/bin/bash

echo "======================================"
echo "🔐 로그인 시스템 테스트"
echo "======================================"
echo ""

BASE_URL="http://localhost:3000"

# 테스트 계정들
declare -A ACCOUNTS=(
  ["director@test.com"]="director123"
  ["teacher@test.com"]="teacher123"
  ["student@test.com"]="student123"
  ["admin@test.com"]="admin123"
)

test_count=0
success_count=0

for email in "${!ACCOUNTS[@]}"; do
  password="${ACCOUNTS[$email]}"
  ((test_count++))
  
  echo "----------------------------------------"
  echo "📧 테스트 $test_count: $email"
  echo "🔑 비밀번호: $password"
  echo ""
  
  # API 호출
  response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")
  
  # 응답 파싱
  success=$(echo "$response" | jq -r '.success')
  message=$(echo "$response" | jq -r '.message')
  
  if [ "$success" = "true" ]; then
    ((success_count++))
    echo "✅ 로그인 성공!"
    echo "메시지: $message"
    
    # 사용자 정보 출력
    user_name=$(echo "$response" | jq -r '.user.name')
    user_role=$(echo "$response" | jq -r '.user.role')
    academy_name=$(echo "$response" | jq -r '.user.academyName')
    
    echo "👤 이름: $user_name"
    echo "🎭 역할: $user_role"
    echo "🏫 학원: $academy_name"
    echo ""
  else
    echo "❌ 로그인 실패!"
    echo "메시지: $message"
    echo ""
  fi
done

echo "======================================"
echo "📊 테스트 결과 요약"
echo "======================================"
echo "총 테스트: $test_count"
echo "성공: $success_count"
echo "실패: $((test_count - success_count))"
echo ""

if [ $success_count -eq $test_count ]; then
  echo "🎉 모든 테스트 통과!"
  exit 0
else
  echo "⚠️ 일부 테스트 실패"
  exit 1
fi
