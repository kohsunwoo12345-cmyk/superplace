#!/bin/bash

echo "🔍 전체 시스템 진단 시작"
echo "=========================================="
echo ""

# 1. 데이터베이스 스키마 확인
echo "1️⃣ 데이터베이스 스키마 확인"
echo "----------------------------------------"

# homework_submissions_v2 스키마
echo "📋 homework_submissions_v2 테이블:"
grep -A 20 "CREATE TABLE IF NOT EXISTS homework_submissions_v2" functions/api/homework/grade.ts | head -15

echo ""

# homework_gradings_v2 스키마  
echo "📋 homework_gradings_v2 테이블:"
grep -A 30 "CREATE TABLE IF NOT EXISTS homework_gradings_v2" functions/api/homework/grade.ts | head -25

echo ""
echo "=========================================="
echo ""

# 2. API 엔드포인트 확인
echo "2️⃣ API 엔드포인트 호출 흐름"
echo "----------------------------------------"

echo "제출 플로우:"
echo "  1) /api/homework/submit"
grep -A 5 "waitUntil" functions/api/homework/submit/index.ts | head -10

echo ""
echo "  2) /api/homework/grade (백그라운드)"
grep "workerUrl" functions/api/homework/grade.ts

echo ""
echo "  3) Python Worker 응답 처리:"
grep -A 3 "homework_gradings_v2에 저장" functions/api/homework/grade.ts | head -5

echo ""
echo "=========================================="
echo ""

# 3. 결과 조회 API 확인
echo "3️⃣ 결과 조회 API 분석"
echo "----------------------------------------"

echo "📊 /api/homework/results 쿼리:"
grep -A 30 "SELECT" functions/api/homework/results.js | head -35

echo ""
echo "=========================================="
echo ""

# 4. 학생 상세 페이지 API 호출 확인
echo "4️⃣ 학생 상세 페이지 숙제 기록 API"
echo "----------------------------------------"

echo "API 호출 코드:"
grep -A 5 "fetchHomeworkSubmissions" src/app/dashboard/students/detail/page.tsx | head -10

echo ""
echo "=========================================="
echo ""

# 5. 문제 진단
echo "5️⃣ 예상 문제점"
echo "----------------------------------------"

echo "❌ 문제 1: 2개씩 나오는 이유"
echo "   → 확인 필요: attendance-verify에서 중복 호출 여부"
grep -n "process-grading" src/app/attendance-verify/page.tsx

echo ""
echo "❌ 문제 2: 0점 표시"
echo "   → Python Worker 응답 확인 필요"
echo "   → 현재 API 키: $(grep 'X-API-Key' functions/api/homework/grade.ts | head -1)"

echo ""
echo "❌ 문제 3: 학생 상세 페이지에 숙제 기록 안 나옴"
echo "   → userId 필터 확인 필요"

echo ""
echo "=========================================="

