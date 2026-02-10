#!/bin/bash

echo "🚀 배포 대기 및 자동 테스트"
echo "Commit: 6f863c6 - D1 타입 에러 수정"
echo ""

# 5분 대기
echo "⏳ 5분 대기 중..."
sleep 300

echo ""
echo "📊 제출 목록 확인..."
node check_submissions_v2.js

echo ""
echo "🔍 AI 채점 테스트 시작..."
node test_grading_detailed.js

