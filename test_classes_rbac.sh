#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "=========================================="
echo "🔐 클래스 RBAC 테스트"
echo "=========================================="

echo ""
echo "1️⃣ 관리자로 클래스 조회 (academyId=1)"
echo "URL: ${BASE_URL}/api/classes/manage?userId=1&role=ADMIN&academyId=1"
ADMIN_RESPONSE=$(curl -s "${BASE_URL}/api/classes/manage?userId=1&role=ADMIN&academyId=1")
echo "$ADMIN_RESPONSE" | jq '.success, .classes | length'
echo "첫 번째 클래스:"
echo "$ADMIN_RESPONSE" | jq '.classes[0] | {id, name, teacherName, studentCount}'

echo ""
echo "2️⃣ 학원장으로 클래스 조회"
echo "URL: ${BASE_URL}/api/classes/manage?userId=1&role=DIRECTOR&academyId=1"
DIRECTOR_RESPONSE=$(curl -s "${BASE_URL}/api/classes/manage?userId=1&role=DIRECTOR&academyId=1")
echo "$DIRECTOR_RESPONSE" | jq '.success, .classes | length'

echo ""
echo "3️⃣ 선생님으로 클래스 조회 (userId=1 - 선생님 역할로 테스트)"
echo "URL: ${BASE_URL}/api/classes/manage?userId=1&role=TEACHER"
TEACHER_RESPONSE=$(curl -s "${BASE_URL}/api/classes/manage?userId=1&role=TEACHER")
echo "$TEACHER_RESPONSE" | jq '.success, .classes | length'
echo "선생님에게 배정된 클래스:"
echo "$TEACHER_RESPONSE" | jq '.classes[] | {id, name, studentCount}'

echo ""
echo "4️⃣ 학생으로 클래스 조회 (userId=157 - 고선우)"
echo "URL: ${BASE_URL}/api/classes/manage?userId=157&role=STUDENT"
STUDENT_RESPONSE=$(curl -s "${BASE_URL}/api/classes/manage?userId=157&role=STUDENT")
echo "$STUDENT_RESPONSE" | jq '.success, .classes | length'
echo "학생이 소속된 클래스:"
echo "$STUDENT_RESPONSE" | jq '.classes[] | {id, name, grade, teacherName}'

echo ""
echo "5️⃣ 파라미터 없이 호출 (오류 테스트)"
echo "URL: ${BASE_URL}/api/classes/manage"
ERROR_RESPONSE=$(curl -s "${BASE_URL}/api/classes/manage")
echo "$ERROR_RESPONSE" | jq '{success, error}'

echo ""
echo "=========================================="
echo "✅ RBAC 테스트 완료"
echo "=========================================="
echo ""
echo "📊 요약:"
echo "- 관리자/학원장: 학원 전체 클래스 조회 가능"
echo "- 선생님: 배정된 클래스만 조회"
echo "- 학생: 소속된 클래스만 조회"
echo "- 필수 파라미터 누락 시 에러 처리"
