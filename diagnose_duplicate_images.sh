#!/bin/bash

echo "=========================================="
echo "🔍 중복 이미지 문제 진단"
echo "=========================================="

echo ""
echo "1. 프론트엔드 - 이미지 배열 확인"
echo "----------------------------"
grep -A 10 "images:" src/app/dashboard/homework/student/page.tsx | head -15

echo ""
echo "2. Submit API - 이미지 처리 로직"
echo "----------------------------"
grep -B 5 -A 10 "imageArray" functions/api/homework/submit/index.ts | head -20

echo ""
echo "3. Grade API - Worker 호출"
echo "----------------------------"
grep -B 5 -A 10 "workerRequest\|images:" functions/api/homework/grade.ts | head -20

echo ""
echo "=========================================="
