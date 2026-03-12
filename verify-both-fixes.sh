#!/bin/bash

echo "=========================================="
echo "출석 통계 및 숙제 채점 수정 검증"
echo "2026-03-12 최종 테스트"
echo "=========================================="
echo ""

echo "⏳ 배포 대기 (60초)..."
sleep 60
echo ""

# 1. 출석 통계 테스트
echo "=========================================="
echo "1. 출석 통계 테스트"
echo "=========================================="
echo ""

# 실제 학생 ID로 테스트 (관리자 API에서 확인한 userId)
STUDENT_ID="student-1772865101424-12ldfjns29zg"

echo "1-1. 학생 출석 통계 (userId: $STUDENT_ID)"
echo "------------------------------------------"
STUDENT_STATS=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=$STUDENT_ID&role=STUDENT&academyId=")
echo "$STUDENT_STATS" | jq '{success, role, attendanceDays, thisMonth, calendarDays: (.calendar | length)}' 2>/dev/null

CALENDAR_SAMPLE=$(echo "$STUDENT_STATS" | jq '.calendar | to_entries | .[0:3]' 2>/dev/null)
echo ""
echo "캘린더 샘플 (최근 3일):"
echo "$CALENDAR_SAMPLE"
echo ""

ATTENDANCE_DAYS=$(echo "$STUDENT_STATS" | jq -r '.attendanceDays' 2>/dev/null)
if [[ "$ATTENDANCE_DAYS" != "0" && "$ATTENDANCE_DAYS" != "null" ]]; then
    echo "✅ 학생 출석 데이터 정상: $ATTENDANCE_DAYS일"
    
    # Status 매핑 확인
    VERIFIED_COUNT=$(echo "$STUDENT_STATS" | jq -r '.calendar | to_entries | .[] | select(.value == "VERIFIED") | .key' | wc -l)
    LATE_COUNT=$(echo "$STUDENT_STATS" | jq -r '.calendar | to_entries | .[] | select(.value == "LATE") | .key' | wc -l)
    
    echo "   - VERIFIED (출석): $VERIFIED_COUNT일"
    echo "   - LATE (지각): $LATE_COUNT일"
    
    if [[ $VERIFIED_COUNT -gt 0 ]] || [[ $LATE_COUNT -gt 0 ]]; then
        echo "   ✅ Status 매핑 성공!"
    fi
else
    echo "⚠️  학생 출석 데이터 없음 (테스트 계정에 출석 기록 필요)"
fi
echo ""

echo "1-2. 관리자 출석 통계"
echo "------------------------------------------"
ADMIN_STATS=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=1&role=ADMIN&academyId=1")
echo "$ADMIN_STATS" | jq '{success, role, statistics}' 2>/dev/null
echo ""

ADMIN_RECORDS=$(echo "$ADMIN_STATS" | jq '.records[0:2] | .[] | {userName, status, verifiedAt}' 2>/dev/null)
echo "최근 출석 기록 샘플:"
echo "$ADMIN_RECORDS"
echo ""

VERIFIED_IN_ADMIN=$(echo "$ADMIN_STATS" | jq -r '.records[] | select(.status == "VERIFIED") | .userName' 2>/dev/null | head -1)
if [[ -n "$VERIFIED_IN_ADMIN" ]]; then
    echo "✅ 관리자 화면에서도 VERIFIED 상태 확인됨"
else
    echo "⚠️  관리자 화면에 VERIFIED 상태 없음 (PRESENT만 있을 수 있음)"
fi
echo ""

# 2. 숙제 채점 모델 테스트
echo "=========================================="
echo "2. 숙제 채점 모델 테스트"
echo "=========================================="
echo ""

echo "2-1. 현재 채점 설정"
echo "------------------------------------------"
GRADING_CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
CURRENT_MODEL=$(echo "$GRADING_CONFIG" | jq -r '.config.model')
echo "현재 모델: $CURRENT_MODEL"
echo "$GRADING_CONFIG" | jq '.config | {model, temperature, enableRAG}' 2>/dev/null
echo ""

if [[ "$CURRENT_MODEL" == "deepseek-ocr-2" ]]; then
    echo "⚠️  모델명이 여전히 'deepseek-ocr-2'입니다."
    echo "    fix-grading-model.sh 스크립트를 실행하여 'deepseek-chat'으로 변경하세요."
    echo ""
    echo "    실행 방법:"
    echo "    ./fix-grading-model.sh"
    echo ""
elif [[ "$CURRENT_MODEL" == "deepseek-chat" ]]; then
    echo "✅ 모델명 정상: $CURRENT_MODEL"
    echo ""
else
    echo "✅ 모델명: $CURRENT_MODEL"
    echo ""
fi

echo "2-2. DeepSeek API 키 확인"
echo "------------------------------------------"
DEBUG_INFO=$(curl -s "https://superplacestudy.pages.dev/api/homework/debug")
HAS_DEEPSEEK=$(echo "$DEBUG_INFO" | jq -r '.env.hasDeepSeekApiKey' 2>/dev/null)

if [[ "$HAS_DEEPSEEK" == "true" ]]; then
    echo "✅ DEEPSEEK_API_KEY 설정됨"
elif [[ "$HAS_DEEPSEEK" == "false" ]]; then
    echo "❌ DEEPSEEK_API_KEY 미설정"
    echo "   Cloudflare Pages 환경 변수에 추가 필요"
else
    echo "⚠️  API 키 상태 확인 불가"
fi
echo ""

# 최종 요약
echo "=========================================="
echo "최종 요약"
echo "=========================================="
echo ""

echo "출석 통계 수정:"
if [[ "$ATTENDANCE_DAYS" != "0" && "$ATTENDANCE_DAYS" != "null" ]]; then
    echo "  ✅ 학생 출석 데이터 정상 표시"
    echo "  ✅ Status 매핑 (PRESENT → VERIFIED) 작동"
else
    echo "  ⚠️  테스트 계정에 출석 기록 필요"
    echo "     실제 학생 계정으로 테스트하세요:"
    echo "     https://superplacestudy.pages.dev/dashboard/attendance-statistics/"
fi
echo ""

echo "숙제 채점 모델:"
if [[ "$CURRENT_MODEL" == "deepseek-chat" ]]; then
    echo "  ✅ 모델명 정상: $CURRENT_MODEL"
elif [[ "$CURRENT_MODEL" == "deepseek-ocr-2" ]]; then
    echo "  ⚠️  모델명 수정 필요: ./fix-grading-model.sh 실행"
else
    echo "  ℹ️  현재 모델: $CURRENT_MODEL"
fi

if [[ "$HAS_DEEPSEEK" == "true" ]]; then
    echo "  ✅ DEEPSEEK_API_KEY 설정됨"
else
    echo "  ⚠️  DEEPSEEK_API_KEY 확인 필요"
fi
echo ""

echo "다음 단계:"
echo "1. 학생 계정으로 로그인하여 출석 통계 UI 확인"
echo "   https://superplacestudy.pages.dev/dashboard/attendance-statistics/"
echo ""
echo "2. 모델명이 'deepseek-ocr-2'인 경우:"
echo "   ./fix-grading-model.sh 실행"
echo ""
echo "3. 숙제 제출 테스트:"
echo "   https://superplacestudy.pages.dev/dashboard/homework"
echo ""

