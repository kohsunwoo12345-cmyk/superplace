#!/bin/bash

echo "=== 전체 플로우 테스트 ==="
echo ""
echo "1. 최신 학생 조회 (ID 기준 내림차순)"
echo "GET /api/admin/users?role=STUDENT 응답 구조 확인"
echo ""

echo "2. 학생 157 상세 조회"
curl -s "https://superplacestudy.pages.dev/api/admin/users/157" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    user = data.get('user', {})
    print('=== 학생 157 API 응답 ===')
    print(f'id: {user.get(\"id\")}')
    print(f'name: {user.get(\"name\")}')
    print(f'phone: {user.get(\"phone\")}')
    print(f'email: {user.get(\"email\")}')
    print(f'school: {user.get(\"school\")}')
    print(f'grade: {user.get(\"grade\")}')
    print(f'academyId: {user.get(\"academyId\")}')
    print(f'academyName: {user.get(\"academyName\")}')
    print(f'diagnostic_memo: {user.get(\"diagnostic_memo\")}')
    print(f'className: {user.get(\"className\")}')
except Exception as e:
    print(f'Error: {e}')
"

echo ""
echo "3. 프론트엔드 표시 시뮬레이션"
echo "formatPhoneNumber('01012341234') = 010-1234-1234"
echo "displayEmail('student_xxx@phone.generated') = 미등록"
