#!/bin/bash

echo "=========================================="
echo "최종 검증 - 출석 통계 & 숙제 채점"
echo "2026-03-12"
echo "=========================================="
echo ""

# Test 1: 출석 통계 (학생)
echo "✅ Test 1: 학생 출석 통계"
echo "------------------------------------------"
STUDENT_RESULT=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=student-1772865101424-12ldfjns29zg&role=STUDENT&academyId=")
HAS_VERIFIED=$(echo "$STUDENT_RESULT" | jq -r '.calendar | to_entries[] | select(.value == "VERIFIED") | .key' | head -1)

if [[ -n "$HAS_VERIFIED" ]]; then
    echo "✅ PASS - 학생 출석 상태가 VERIFIED로 표시됨"
    echo "   예시 날짜: $HAS_VERIFIED"
else
    echo "❌ FAIL - VERIFIED 상태가 표시되지 않음"
fi
echo ""

# Test 2: 출석 통계 (관리자)
echo "✅ Test 2: 관리자 출석 통계"
echo "------------------------------------------"
ADMIN_RESULT=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=1&role=ADMIN&academyId=1")
ADMIN_VERIFIED=$(echo "$ADMIN_RESULT" | jq -r '.records[] | select(.status == "VERIFIED") | .userName' | head -1)

if [[ -n "$ADMIN_VERIFIED" ]]; then
    echo "✅ PASS - 관리자 화면에서 VERIFIED 상태 확인됨"
    echo "   예시 학생: $ADMIN_VERIFIED"
else
    echo "❌ FAIL - 관리자 화면에 VERIFIED 상태 없음"
fi
echo ""

# Test 3: 숙제 채점 모델 설정
echo "✅ Test 3: 숙제 채점 모델 설정"
echo "------------------------------------------"
GRADING_CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
CURRENT_MODEL=$(echo "$GRADING_CONFIG" | jq -r '.config.model')

if [[ "$CURRENT_MODEL" == "deepseek-chat" ]]; then
    echo "✅ PASS - 모델명이 'deepseek-chat'으로 설정됨"
elif [[ "$CURRENT_MODEL" == "gemini-2.5-flash" ]]; then
    echo "⚠️  INFO - 모델이 'gemini-2.5-flash'로 설정됨 (정상)"
else
    echo "❌ FAIL - 예상치 못한 모델명: $CURRENT_MODEL"
fi
echo "   현재 모델: $CURRENT_MODEL"
echo ""

# Summary
echo "=========================================="
echo "검증 요약"
echo "=========================================="
echo ""

if [[ -n "$HAS_VERIFIED" && -n "$ADMIN_VERIFIED" && ( "$CURRENT_MODEL" == "deepseek-chat" || "$CURRENT_MODEL" == "gemini-2.5-flash" ) ]]; then
    echo "✅ 모든 테스트 통과!"
    echo ""
    echo "다음 단계:"
    echo "1. 실제 학생 계정으로 로그인하여 UI 확인"
    echo "   https://superplacestudy.pages.dev/dashboard/attendance-statistics/"
    echo ""
    echo "2. DEEPSEEK_API_KEY 환경 변수 확인"
    echo "   Cloudflare Pages → Settings → Environment variables"
    echo "   변수명: DEEPSEEK_API_KEY (오타 주의: deepsick_API_KEY ❌)"
    echo ""
    echo "3. 숙제 제출 및 채점 테스트"
    echo "   https://superplacestudy.pages.dev/dashboard/homework"
else
    echo "⚠️  일부 테스트 실패"
    echo ""
    if [[ -z "$HAS_VERIFIED" ]]; then
        echo "  - 학생 출석 상태 매핑 확인 필요"
    fi
    if [[ -z "$ADMIN_VERIFIED" ]]; then
        echo "  - 관리자 출석 상태 매핑 확인 필요"
    fi
    if [[ "$CURRENT_MODEL" != "deepseek-chat" && "$CURRENT_MODEL" != "gemini-2.5-flash" ]]; then
        echo "  - 숙제 채점 모델명 확인 필요"
    fi
fi
echo ""

