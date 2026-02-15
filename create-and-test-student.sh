#!/bin/bash

echo "=== 학생 추가 및 조회 테스트 ==="
echo ""

# 1. 학생 추가 시뮬레이션
echo "1. 학생 생성 API 호출 (시뮬레이션)"
echo "POST /api/students/create"
echo '{
  "name": "테스트학생999",
  "phone": "010-9999-7777",
  "school": "테스트고등학교",
  "grade": "고2",
  "email": "test999@example.com",
  "password": "test1234",
  "diagnosticMemo": "테스트 진단 메모",
  "academyId": 1,
  "role": "DIRECTOR"
}' | python3 -m json.tool

echo ""
echo "2. users 테이블 확인 (최신 학생 ID 추정)"
echo "   - 방금 추가한 학생은 가장 큰 ID를 가질 것"
echo ""

echo "3. 실제 데이터 흐름:"
echo "   프론트엔드 → POST /api/students/create → users 테이블 INSERT"
echo "                                          → students 테이블 INSERT"
echo "   프론트엔드 → GET /api/admin/users/[id] → users + students JOIN"
echo "                                          → 프론트엔드 표시"
echo ""

echo "4. 문제 진단:"
echo "   - students 테이블에 데이터가 실제로 저장되는가?"
echo "   - API가 students 테이블을 제대로 조회하는가?"
echo "   - 프론트엔드가 받은 데이터를 올바르게 표시하는가?"
