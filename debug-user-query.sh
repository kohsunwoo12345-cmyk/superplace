#!/bin/bash

echo "=== User 조회 디버깅 ==="
echo ""

PHONE="01051363624"
USER_ID="student-1772865608071-3s67r1wq6n5"

echo "전화번호로 조회 테스트:"
curl -s "https://suplacestudy.com/api/students/by-academy?id=$USER_ID" | jq '.'
