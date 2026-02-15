#!/bin/bash

echo "=== 학생 추가 테스트 시작 ==="
echo ""

# 타임스탬프로 고유 이메일 생성
TIMESTAMP=$(date +%s)
EMAIL="test${TIMESTAMP}@example.com"

echo "1. 테스트 데이터:"
echo "   이름: 테스트학생"
echo "   전화번호: 010-1234-5678"
echo "   학교: 테스트고등학교"
echo "   학년: 고2"
echo "   이메일: $EMAIL"
echo "   비밀번호: test1234"
echo ""

echo "2. API 호출 중..."
RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/students/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"테스트학생\",
    \"phone\": \"010-1234-5678\",
    \"school\": \"테스트고등학교\",
    \"grade\": \"고2\",
    \"email\": \"${EMAIL}\",
    \"password\": \"test1234\",
    \"diagnosticMemo\": \"테스트 진단 메모\",
    \"academyId\": 120,
    \"role\": \"DIRECTOR\"
  }")

echo "3. 응답:"
echo "$RESPONSE" | python3 -m json.tool
echo ""

# 성공 여부 확인
SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

if [ "$SUCCESS" = "True" ]; then
    STUDENT_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('studentId', 'N/A'))")
    echo "✅ 학생 생성 성공! ID: $STUDENT_ID"
    echo ""
    echo "4. 3초 대기 후 데이터 확인..."
    sleep 3
    
    echo "5. 생성된 학생 정보 조회:"
    curl -s "https://superplacestudy.pages.dev/api/admin/users/$STUDENT_ID" | python3 -m json.tool
else
    echo "❌ 학생 생성 실패!"
    echo ""
    echo "에러 내용:"
    echo "$RESPONSE"
fi

