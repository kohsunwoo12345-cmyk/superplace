#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🧪 학생 숙제 조회 테스트"
echo "====================================="
echo ""

# 1. 학생 ID 129 (academyId = "1.0")
echo "1️⃣ 학생 129번 숙제 조회 (academyId 없이)"
RESPONSE1=$(curl -s "${BASE_URL}/api/homework/assignments/student?studentId=129")
echo "$RESPONSE1" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE1"
echo ""

COUNT1=$(echo $RESPONSE1 | grep -o '"id":"assignment-' | wc -l)
echo "   숙제 수: $COUNT1개"
echo ""

# 2. 학생 ID 129 + academyId=1
echo "2️⃣ 학생 129번 숙제 조회 (academyId=1)"
RESPONSE2=$(curl -s "${BASE_URL}/api/homework/assignments/student?studentId=129&academyId=1")
echo "$RESPONSE2" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE2"
echo ""

COUNT2=$(echo $RESPONSE2 | grep -o '"id":"assignment-' | wc -l)
echo "   숙제 수: $COUNT2개"
echo ""

# 3. 현재 생성된 숙제 확인
echo "3️⃣ 현재 생성된 숙제 확인 (teacherId=1)"
TEACHER_RESPONSE=$(curl -s "${BASE_URL}/api/homework/assignments/teacher?teacherId=1")
TEACHER_COUNT=$(echo $TEACHER_RESPONSE | grep -o '"id":"assignment-' | wc -l)
echo "   선생님이 생성한 숙제: $TEACHER_COUNT개"
echo ""

# academyId 확인
ACADEMY_ID=$(echo $TEACHER_RESPONSE | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['assignments'][0].get('academyId', 'null') if data.get('assignments') else 'no assignments')" 2>/dev/null)
echo "   숙제의 academyId: $ACADEMY_ID"
echo ""

# 4. 학생 정보 확인 (academyId)
echo "4️⃣ 학생 129번 정보 확인"
STUDENTS=$(curl -s "${BASE_URL}/api/students?academyId=1&role=TEACHER&userId=1")
STUDENT_INFO=$(echo $STUDENTS | python3 -c "import sys,json; data=json.load(sys.stdin); students = data.get('students', []); student = next((s for s in students if s['id'] == 129), None); print(json.dumps(student) if student else 'not found')" 2>/dev/null)
echo "   학생 정보: $STUDENT_INFO"
echo ""

echo "====================================="
echo "📊 결과:"
echo "   학생의 숙제 (academyId 없음): $COUNT1개"
echo "   학생의 숙제 (academyId=1): $COUNT2개"
echo "   선생님이 생성한 숙제: $TEACHER_COUNT개"
echo "   숙제의 academyId: $ACADEMY_ID"
echo ""

if [ "$COUNT1" -gt "0" ] || [ "$COUNT2" -gt "0" ]; then
    echo "✅ 학생이 숙제를 볼 수 있습니다!"
else
    echo "❌ 학생이 숙제를 볼 수 없습니다!"
    echo ""
    echo "가능한 원인:"
    echo "1. 숙제의 academyId와 학생의 academyId 불일치"
    echo "2. targetType이 'specific'인데 학생이 target에 없음"
    echo "3. dueDate가 과거 날짜"
fi

echo "====================================="
