#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🧪 숙제 시스템 완전 테스트"
echo "====================================="
echo ""

# 배포 대기
echo "⏳ 배포 완료 대기 (90초)..."
sleep 90

echo "====================================="
echo "테스트 시작!"
echo "====================================="
echo ""

# 1. 학생 목록
echo "1️⃣ 학생 목록 조회"
STUDENTS=$(curl -s "${BASE_URL}/api/students?academyId=1&role=TEACHER&userId=1")
STUDENT_COUNT=$(echo $STUDENTS | grep -o '"count":[0-9]*' | cut -d':' -f2)
STUDENT_ID=$(echo $STUDENTS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "   학생 수: $STUDENT_COUNT"
echo "   첫 번째 학생 ID: $STUDENT_ID"
if [ "$STUDENT_COUNT" -gt "0" ]; then
    echo "   ✅ 성공: 학생 목록 정상 조회"
else
    echo "   ❌ 실패: 학생 목록 없음"
fi
echo ""

# 2. 숙제 생성
echo "2️⃣ 숙제 생성"
HOMEWORK_DATA=$(cat <<JSON
{
  "teacherId": 1,
  "title": "완전 통합 테스트 숙제",
  "description": "모든 수정사항 검증용",
  "subject": "수학",
  "dueDate": "2026-02-15 23:59:00",
  "targetType": "specific",
  "targetStudents": [$STUDENT_ID]
}
JSON
)

CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/homework/assignments/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "$HOMEWORK_DATA")

CREATE_SUCCESS=$(echo $CREATE_RESPONSE | grep -o '"success":true' | wc -l)
if [ "$CREATE_SUCCESS" -gt "0" ]; then
    ASSIGNMENT_ID=$(echo $CREATE_RESPONSE | grep -o '"assignmentId":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ 성공: 숙제 생성됨"
    echo "   Assignment ID: $ASSIGNMENT_ID"
else
    echo "   ❌ 실패: 숙제 생성 실패"
    echo "   응답: $CREATE_RESPONSE"
fi
echo ""

# 3. 숙제 조회 (academyId 필터 없이)
echo "3️⃣ 숙제 조회 (academyId 필터 없이)"
ASSIGNMENTS_NO_FILTER=$(curl -s "${BASE_URL}/api/homework/assignments/teacher?teacherId=1")
echo "$ASSIGNMENTS_NO_FILTER" | head -c 300
echo "..."
NO_FILTER_COUNT=$(echo $ASSIGNMENTS_NO_FILTER | grep -o '"id":"assignment-' | wc -l)
echo ""
echo "   숙제 수: $NO_FILTER_COUNT"
if [ "$NO_FILTER_COUNT" -gt "0" ]; then
    echo "   ✅ 성공: 숙제 조회됨"
else
    echo "   ⚠️  주의: 숙제 없음 또는 에러"
fi
echo ""

# 4. 숙제 조회 (academyId=1)
echo "4️⃣ 숙제 조회 (academyId=1로 필터)"
ASSIGNMENTS_WITH_FILTER=$(curl -s "${BASE_URL}/api/homework/assignments/teacher?teacherId=1&academyId=1")
echo "$ASSIGNMENTS_WITH_FILTER" | head -c 300
echo "..."
WITH_FILTER_COUNT=$(echo $ASSIGNMENTS_WITH_FILTER | grep -o '"id":"assignment-' | wc -l)
echo ""
echo "   숙제 수: $WITH_FILTER_COUNT"
if [ "$WITH_FILTER_COUNT" -gt "0" ]; then
    echo "   ✅ 성공: academyId 필터링 작동"
else
    echo "   ⚠️  주의: academyId 필터링 안됨 또는 에러"
fi
echo ""

echo "====================================="
echo "📊 최종 결과 요약"
echo "====================================="
echo ""
echo "✅ 학생 조회: $STUDENT_COUNT명"
echo "✅ 숙제 생성: $([ "$CREATE_SUCCESS" -gt "0" ] && echo '성공' || echo '실패')"
echo "✅ 숙제 조회 (필터 없음): $NO_FILTER_COUNT개"
echo "✅ 숙제 조회 (필터 있음): $WITH_FILTER_COUNT개"
echo ""

if [ "$STUDENT_COUNT" -gt "0" ] && [ "$CREATE_SUCCESS" -gt "0" ] && [ "$WITH_FILTER_COUNT" -gt "0" ]; then
    echo "🎉 모든 테스트 통과!"
    echo ""
    echo "웹 UI에서 확인:"
    echo "${BASE_URL}/dashboard/homework/teacher"
else
    echo "⚠️  일부 테스트 실패 - 로그 확인 필요"
fi

echo ""
echo "====================================="
