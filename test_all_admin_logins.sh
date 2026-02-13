#!/bin/bash
echo "=== 🔐 모든 admin 계정 테스트 ==="
echo ""

for EMAIL in "admin@superplace.co.kr" "admin@superplace.com" "admin@test.com"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "테스트: $EMAIL"
    
    RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$EMAIL\",\"password\":\"admin123\"}")
    
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    if [ "$SUCCESS" == "true" ]; then
        ROLE=$(echo "$RESPONSE" | jq -r '.data.user.role')
        echo "✅ 로그인 성공!"
        echo "   role: $ROLE"
        echo "   대문자: ${ROLE^^}"
    else
        echo "❌ 로그인 실패"
        echo "   메시지: $(echo "$RESPONSE" | jq -r '.message')"
    fi
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 해결책:"
echo "1. 정확한 이메일 주소 확인 필요"
echo "2. 비밀번호 확인 필요"
echo "3. 또는 데이터베이스에서 직접 role 확인 필요"
echo ""
echo "브라우저에서 로그인 후 콘솔에서 확인:"
echo "  localStorage.getItem('user')"
