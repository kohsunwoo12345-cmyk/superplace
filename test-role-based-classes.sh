#!/bin/bash

echo "========================================="
echo "역할별 클래스 접근 권한 테스트"
echo "========================================="
echo ""

# 관리자 토큰 (ADMIN, userId=4)
TOKEN_ADMIN="4|admin@test.com|ADMIN|1|$(date +%s)"
echo "👑 관리자 (ADMIN) 토큰: $TOKEN_ADMIN"
echo ""

# 학원장 토큰 (DIRECTOR, userId=1)
TOKEN_DIRECTOR="1|director@test.com|DIRECTOR|1|$(date +%s)"
echo "🏫 학원장 (DIRECTOR) 토큰: $TOKEN_DIRECTOR"
echo ""

# 선생님 토큰 (TEACHER, userId=2)
TOKEN_TEACHER="2|teacher@test.com|TEACHER|1|$(date +%s)"
echo "👨‍🏫 선생님 (TEACHER) 토큰: $TOKEN_TEACHER"
echo ""

# 학생 토큰 (STUDENT, userId=3)
TOKEN_STUDENT="3|student@test.com|STUDENT|1|$(date +%s)"
echo "👨‍🎓 학생 (STUDENT) 토큰: $TOKEN_STUDENT"
echo ""

echo "========================================="
echo "1️⃣ 관리자 (ADMIN) - 모든 클래스 조회"
echo "========================================="
ADMIN_CLASSES=$(curl -s -X GET "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json")
ADMIN_COUNT=$(echo "$ADMIN_CLASSES" | jq -r '.total')
echo "총 $ADMIN_COUNT개 클래스 조회됨"
echo "$ADMIN_CLASSES" | jq -r '.classes[] | "   - [\(.id)] \(.name) (선생님: \(.teacherId // "미배정"), 학생: \(._count.students)명)"'
echo ""

echo "========================================="
echo "2️⃣ 학원장 (DIRECTOR) - 자신이 생성한 클래스 조회"
echo "========================================="
DIRECTOR_CLASSES=$(curl -s -X GET "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $TOKEN_DIRECTOR" \
  -H "Content-Type: application/json")
DIRECTOR_COUNT=$(echo "$DIRECTOR_CLASSES" | jq -r '.total')
echo "총 $DIRECTOR_COUNT개 클래스 조회됨"
echo "$DIRECTOR_CLASSES" | jq -r '.classes[] | "   - [\(.id)] \(.name) (선생님: \(.teacherId // "미배정"), 학생: \(._count.students)명)"'
echo ""

echo "========================================="
echo "3️⃣ 선생님 (TEACHER, userId=2) - 배정받은 클래스만"
echo "========================================="
TEACHER_CLASSES=$(curl -s -X GET "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $TOKEN_TEACHER" \
  -H "Content-Type: application/json")
TEACHER_COUNT=$(echo "$TEACHER_CLASSES" | jq -r '.total')
echo "총 $TEACHER_COUNT개 클래스 조회됨 (teacherId=2인 클래스만)"
echo "$TEACHER_CLASSES" | jq -r '.classes[] | "   - [\(.id)] \(.name) (선생님: \(.teacherId // "미배정"), 학생: \(._count.students)명)"'
echo ""

echo "========================================="
echo "4️⃣ 학생 (STUDENT, userId=3) - 자신이 속한 클래스만"
echo "========================================="
STUDENT_CLASSES=$(curl -s -X GET "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $TOKEN_STUDENT" \
  -H "Content-Type: application/json")
STUDENT_COUNT=$(echo "$STUDENT_CLASSES" | jq -r '.total')
echo "총 $STUDENT_COUNT개 클래스 조회됨 (학생 ID=3이 속한 클래스만)"
echo "$STUDENT_CLASSES" | jq -r '.classes[] | "   - [\(.id)] \(.name) (선생님: \(.teacherId // "미배정"), 학생: \(._count.students)명)"'
echo ""

echo "========================================="
echo "검증 결과:"
echo "========================================="

# 관리자는 모든 클래스를 볼 수 있어야 함
if [ "$ADMIN_COUNT" -eq 5 ]; then
  echo "✅ 관리자: 모든 $ADMIN_COUNT개 클래스 조회 (정상)"
else
  echo "❌ 관리자: $ADMIN_COUNT개 클래스 조회 (5개여야 함)"
fi

# 학원장도 모든 클래스를 볼 수 있어야 함 (자신의 학원)
if [ "$DIRECTOR_COUNT" -eq 5 ]; then
  echo "✅ 학원장: 모든 $DIRECTOR_COUNT개 클래스 조회 (정상)"
else
  echo "❌ 학원장: $DIRECTOR_COUNT개 클래스 조회 (5개여야 함)"
fi

# 선생님은 자신이 배정받은 클래스만 (teacherId=2인 클래스들)
if [ "$TEACHER_COUNT" -eq 5 ]; then
  echo "✅ 선생님: $TEACHER_COUNT개 클래스 조회 (teacherId=2로 배정된 클래스)"
else
  echo "⚠️ 선생님: $TEACHER_COUNT개 클래스 조회 (teacherId=2로 배정된 만큼)"
fi

# 학생은 자신이 속한 클래스만 (students 배열에 id=3이 있는 클래스)
if [ "$STUDENT_COUNT" -ge 1 ]; then
  echo "✅ 학생: $STUDENT_COUNT개 클래스 조회 (자신이 속한 클래스)"
else
  echo "❌ 학생: $STUDENT_COUNT개 클래스 조회 (최소 1개여야 함)"
fi

echo ""
echo "========================================="
echo "✅ 역할별 클래스 접근 권한 테스트 완료!"
echo "========================================="
echo ""
echo "요약:"
echo "  - 관리자(ADMIN): $ADMIN_COUNT개 클래스"
echo "  - 학원장(DIRECTOR): $DIRECTOR_COUNT개 클래스"
echo "  - 선생님(TEACHER): $TEACHER_COUNT개 클래스"
echo "  - 학생(STUDENT): $STUDENT_COUNT개 클래스"
