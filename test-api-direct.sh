#!/bin/bash

echo "=== Testing Student Creation API Directly ==="
echo ""

# Test with proper Korean text
curl -X POST "https://superplacestudy.pages.dev/api/students/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "김철수",
    "phone": "010-1234-5678",
    "school": "서울고등학교",
    "grade": "고2",
    "email": "testkim@example.com",
    "password": "test1234",
    "diagnosticMemo": "수학 보강 필요",
    "academyId": 120,
    "role": "DIRECTOR"
  }' | python3 -m json.tool

echo ""
echo "=== Check if student was created ==="
sleep 2

# Get the student ID from response
STUDENT_ID=$(curl -s "https://superplacestudy.pages.dev/api/admin/users" | python3 -c "import sys, json; users=json.load(sys.stdin)['users']; print(max([u['id'] for u in users]))")

echo "Latest student ID: $STUDENT_ID"
echo ""

curl -s "https://superplacestudy.pages.dev/api/admin/users/$STUDENT_ID" | python3 -m json.tool

