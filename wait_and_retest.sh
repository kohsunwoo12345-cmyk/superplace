#!/bin/bash

echo "🚀 개선된 Gemini 프롬프트 배포 대기"
echo "Commit: 6985492 - 정확한 채점을 위한 프롬프트 개선"
echo ""
echo "주요 개선 사항:"
echo "  ✅ 모든 문제를 하나씩 확인하도록 강제"
echo "  ✅ 점수 계산 정확성 강조"
echo "  ✅ 0점 방지 (최소 20점)"
echo "  ✅ 문제별 상세 분석 요구"
echo "  ✅ 피드백 최소 7문장"
echo "  ✅ 상세 분석 최소 15문장"
echo ""

# 5분 대기
echo "⏳ 5분 대기 중..."
sleep 300

echo ""
echo "📊 기존 제출 목록 확인..."
node check_submissions_v2.js

echo ""
echo "🔍 채점 대기 중인 숙제가 있다면 테스트..."

