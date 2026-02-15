#!/bin/bash

echo "=== 학생 추가 API 테스트 ==="
echo ""
echo "1. 학생 생성 요청 시뮬레이션"
echo '{"name":"테스트학생","phone":"010-9999-8888","school":"테스트고등학교","grade":"고2","email":"test@example.com","password":"test1234","diagnosticMemo":"테스트 메모","academyId":1,"role":"DIRECTOR"}' | python3 -m json.tool

echo ""
echo "2. 생성 후 조회되는 데이터 확인"
curl -s "https://superplacestudy.pages.dev/api/admin/users/157" | python3 -c "
import sys, json
data = json.load(sys.stdin)
user = data['user']
print('=== API 응답 분석 ===')
print(f'id: {user.get(\"id\")}')
print(f'name: {user.get(\"name\")}')
print(f'phone: {user.get(\"phone\")}')
print(f'email: {user.get(\"email\")}')
print(f'school: {user.get(\"school\")}')
print(f'grade: {user.get(\"grade\")}')
print(f'academyName: {user.get(\"academyName\")}')
print(f'diagnostic_memo: {user.get(\"diagnostic_memo\")}')
"
