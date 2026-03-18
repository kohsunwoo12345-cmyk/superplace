#!/bin/bash

echo "============================================="
echo "학생 데이터 진단 및 출석 코드 테이블 분석"
echo "============================================="
echo ""

echo "=== 1. users 테이블 역할 분포 확인 ==="
SCHEMA_DATA=$(curl -X GET "https://suplacestudy.com/api/admin/check-users-schema" -s)

echo "전체 샘플 데이터 (5개):"
echo "$SCHEMA_DATA" | jq '.sampleData[0:5] | .[] | {id, name, email, role, academy_id, academyId}' 

echo ""
echo "역할 통계:"
echo "$SCHEMA_DATA" | jq -r '.sampleData[].role' | sort | uniq -c

echo ""
echo ""
echo "=== 2. student_attendance_codes 테이블 확인 ==="
echo "📝 모든 활성 출석 코드 조회"

# Debug API 호출
curl -X GET "https://suplacestudy.com/api/admin/debug-attendance-codes" -s | jq '.' | head -50

echo ""
echo ""
echo "=== 3. 문제 분석 ==="
echo ""
echo "가능한 원인:"
echo "1. users 테이블에 role='STUDENT' 인 사용자가 없음"
echo "2. student_attendance_codes의 userId가 TEXT 타입인데 users.id는 INTEGER"
echo "3. 출석 코드 생성 시 userId가 잘못 저장됨"
echo ""
echo "다음 단계:"
echo "1. 테스트 학생 계정 생성 필요"
echo "2. 출석 코드 생성 API 수정 필요 (타입 매칭)"
echo ""
