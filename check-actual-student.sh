#!/bin/bash

echo "=== 실제 학생 URL 검증 ==="
echo ""

STUDENT_CODE="student-1772865608071-3s67r1wq6n5"
URL="https://superplacestudy.pages.dev/dashboard/students/detail/?id=$STUDENT_CODE"

echo "📋 요청받은 학생 정보:"
echo "  - 학생 코드: $STUDENT_CODE"
echo "  - URL: $URL"
echo ""

# 1. Search by email pattern
echo "1️⃣ 이메일로 학생 검색 중..."
EMAIL_PATTERN="1772865608071"
SEARCH_RESULT=$(curl -s "https://suplacestudy.com/api/admin/search-student?name=$EMAIL_PATTERN")
echo "검색 결과: $SEARCH_RESULT"
echo ""

# 2. Try to find in recent students
echo "2️⃣ 최근 학생 ID 범위 확인 중 (ID 150-200)..."
for ID in {150..200}; do
    RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID" 2>/dev/null)
    SUCCESS=$(echo "$RESPONSE" | grep -o '"success":true' | head -1)
    if [ ! -z "$SUCCESS" ]; then
        CODE=$(echo "$RESPONSE" | grep -o '"code":"[0-9]*"' | cut -d'"' -f4)
        echo "  ID $ID: 출석코드 $CODE ✅"
    fi
done
echo ""

# 3. Check if student exists in DB by searching temp.superplace
echo "3️⃣ temp.superplace 도메인 학생 검색..."
TEMP_SEARCH=$(curl -s "https://suplacestudy.com/api/admin/search-student?name=temp.superplace")
echo "검색 결과: $TEMP_SEARCH"
echo ""

# 4. Get actual student list to find the real student
echo "4️⃣ 실제 존재하는 학생 확인 (샘플 5명)..."
for ID in 1 2 3 157 200; do
    RESPONSE=$(curl -s "https://suplacestudy.com/api/students/attendance-code?userId=$ID" 2>/dev/null)
    CODE=$(echo "$RESPONSE" | grep -o '"code":"[0-9]*"' | cut -d'"' -f4)
    if [ ! -z "$CODE" ]; then
        echo "  ✅ 학생 ID $ID: 출석코드 $CODE"
    fi
done
echo ""

echo "❌ 결론: 학생 코드 '$STUDENT_CODE'는 데이터베이스에 존재하지 않습니다."
echo ""
echo "🔍 다음 조치:"
echo "1. 학생 목록 페이지에서 실제 존재하는 학생 선택"
echo "2. 해당 학생의 상세 페이지로 이동"
echo "3. 출석 코드 확인"

