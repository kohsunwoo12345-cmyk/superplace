#!/bin/bash

echo "=== 기존 출석 코드 데이터 확인 ==="

# 샘플 기존 코드들 확인
curl -s "https://suplacestudy.com/api/attendance/code?userId=1" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('code'):
    print('기존 학생 ID=1 코드:', data.get('code'))
    print('userId 값:', data.get('userId'))
    print('userId 타입:', type(data.get('userId')).__name__)
"

echo ""
echo "=== 문제: 기존 코드는 TEXT userId로 저장됨 ==="
echo "해결: student_attendance_codes 테이블의 userId를 모두 INTEGER로 변환 필요"

