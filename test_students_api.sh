#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🧪 학생 API 테스트"
echo "====================================="
echo ""

# 1. academyId만으로 조회 (현재 프론트엔드 방식)
echo "1️⃣ academyId만으로 조회 (현재 방식)"
RESPONSE_1=$(curl -s "${BASE_URL}/api/students?academyId=1")
echo "Response: $RESPONSE_1"
STUDENT_COUNT_1=$(echo $RESPONSE_1 | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "✅ 학생 수: $STUDENT_COUNT_1"
echo ""

# 2. role=TEACHER와 함께 조회
echo "2️⃣ role=TEACHER와 함께 조회"
RESPONSE_2=$(curl -s "${BASE_URL}/api/students?academyId=1&role=TEACHER&userId=1")
echo "Response: $RESPONSE_2"
STUDENT_COUNT_2=$(echo $RESPONSE_2 | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "✅ 학생 수: $STUDENT_COUNT_2"
echo ""

# 3. admin 이메일로 조회
echo "3️⃣ admin@superplace.co.kr로 조회"
RESPONSE_3=$(curl -s "${BASE_URL}/api/students?email=admin@superplace.co.kr")
echo "Response: $RESPONSE_3"
STUDENT_COUNT_3=$(echo $RESPONSE_3 | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "✅ 학생 수: $STUDENT_COUNT_3"
echo ""

echo "====================================="
echo "📊 요약:"
echo "- academyId만: $STUDENT_COUNT_1개"
echo "- role=TEACHER: $STUDENT_COUNT_2개"
echo "- admin 이메일: $STUDENT_COUNT_3개"
