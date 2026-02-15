#!/bin/bash

echo "=== TESTING STUDENT CREATION WITH FULL DATA ==="
echo ""

# Test with complete student data
echo "1. Creating student with complete data..."
RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/students/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트최종",
    "phone": "010-9876-5432",
    "school": "최종테스트고등학교",
    "grade": "고3",
    "email": "finaltest@example.com",
    "password": "final1234",
    "diagnosticMemo": "최종 테스트 메모입니다",
    "academyId": 120,
    "role": "DIRECTOR"
  }')

echo "$RESPONSE" | python3 -m json.tool
STUDENT_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('studentId', 'ERROR'))")

echo ""
echo "2. Waiting for database write..."
sleep 3

echo ""
echo "3. Fetching student details for ID: $STUDENT_ID"
curl -s "https://superplacestudy.pages.dev/api/admin/users/$STUDENT_ID" | python3 -m json.tool

echo ""
echo "=== TEST COMPLETE ==="
echo ""
echo "Expected results:"
echo "✅ Name: 테스트최종"
echo "✅ Phone: 010-9876-5432"
echo "✅ Email: finaltest@example.com"
echo "✅ School: 최종테스트고등학교"
echo "✅ Grade: 고3"
echo "✅ Diagnostic Memo: 최종 테스트 메모입니다"
echo "✅ Password: final1234"

