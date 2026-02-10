#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🔍 학생 129의 실제 academy 찾기"
echo "================================="
echo ""

echo "1️⃣ 학생 129 정보 조회"
STUDENT_RESPONSE=$(curl -s "${BASE_URL}/api/students?academyId=1&role=TEACHER&userId=1")
STUDENT_INFO=$(echo "$STUDENT_RESPONSE" | jq '.students[] | select(.id == 129)' 2>/dev/null)
echo "$STUDENT_INFO"

ACADEMY_ID=$(echo "$STUDENT_INFO" | jq -r '.academyId' 2>/dev/null)
echo ""
echo "  → academyId: '$ACADEMY_ID'"

echo ""
echo "2️⃣ Academy 목록에서 일치하는 ID 찾기"
ACADEMY_RESPONSE=$(curl -s "${BASE_URL}/api/admin/academies")

echo "$ACADEMY_RESPONSE" | jq '.academies[] | select(.id | contains("1"))' 2>/dev/null | head -20

echo ""
echo "🔧 문제:"
echo "   학생의 academyId가 '1.0'인데,"
echo "   academy 테이블의 id는 '103', '104', '118' 등 3자리 문자열"
echo "   → 매칭되지 않음!"
echo ""
echo "💡 해결 방법:"
echo "   1) 학생 데이터를 수정하여 올바른 academyId 설정"
echo "   2) 또는 DB 마이그레이션으로 academy.id를 정수로 변경"

