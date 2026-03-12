#!/bin/bash

echo "=========================================="
echo "전체 시스템 진단 및 테스트"
echo "2026-03-12"
echo "=========================================="
echo ""

# 1. 출석 통계 API 테스트 (여러 사용자)
echo "1. 출석 통계 API 테스트"
echo "=========================================="
echo ""

echo "1-1. userId=1로 학생 조회"
echo "------------------------------------------"
curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=1&role=STUDENT&academyId=" | jq '.' 
echo ""

echo "1-2. 실제 학생 ID로 조회 (student-1772865101424-12ldfjns29zg)"
echo "------------------------------------------"
curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=student-1772865101424-12ldfjns29zg&role=STUDENT&academyId=" | jq '.'
echo ""

echo "1-3. 관리자 뷰로 조회"
echo "------------------------------------------"
ADMIN_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=1&role=ADMIN&academyId=1")
echo "$ADMIN_RESPONSE" | jq '{success, role, statistics, recordCount: (.records | length)}'
echo ""
echo "최근 출석 기록 샘플:"
echo "$ADMIN_RESPONSE" | jq '.records[0:3]'
echo ""

# 2. 숙제 채점 설정 확인
echo "2. 숙제 채점 설정 확인"
echo "=========================================="
echo ""

GRADING_CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
echo "현재 설정:"
echo "$GRADING_CONFIG" | jq '.config | {id, model, temperature, maxTokens, enableRAG}'
echo ""

CURRENT_MODEL=$(echo "$GRADING_CONFIG" | jq -r '.config.model')
echo "현재 모델: $CURRENT_MODEL"
echo ""

if [[ "$CURRENT_MODEL" == "deepseek/deepseek-ocr-2" ]]; then
    echo "✅ 모델명이 올바르게 설정됨: deepseek/deepseek-ocr-2"
elif [[ "$CURRENT_MODEL" == "deepseek-chat" ]]; then
    echo "❌ 모델명이 잘못됨: deepseek-chat"
    echo "   올바른 모델명: deepseek/deepseek-ocr-2"
else
    echo "⚠️  예상치 못한 모델명: $CURRENT_MODEL"
fi
echo ""

# 3. 환경 변수 확인
echo "3. 환경 변수 확인"
echo "=========================================="
echo ""

DEBUG_INFO=$(curl -s "https://superplacestudy.pages.dev/api/homework/debug")
echo "$DEBUG_INFO" | jq '.'
echo ""

# 4. 출석 데이터 직접 확인
echo "4. 출석 데이터 직접 확인"
echo "=========================================="
echo ""

CHECK_DATA=$(curl -s "https://superplacestudy.pages.dev/api/admin/check-attendance-data")
TOTAL_RECORDS=$(echo "$CHECK_DATA" | jq '.total' 2>/dev/null)

if [[ "$TOTAL_RECORDS" != "null" && "$TOTAL_RECORDS" != "" ]]; then
    echo "전체 출석 레코드 수: $TOTAL_RECORDS"
    echo ""
    echo "최근 레코드 샘플:"
    echo "$CHECK_DATA" | jq '.records[0:5] | .[] | {userId, status, checkInTime}' 2>/dev/null
else
    echo "⚠️  출석 데이터 API 응답 없음"
fi
echo ""

# 5. 프론트엔드 페이지 확인
echo "5. 프론트엔드 페이지 확인"
echo "=========================================="
echo ""

ATTENDANCE_PAGE=$(curl -s "https://superplacestudy.pages.dev/dashboard/attendance-statistics/")
PAGE_STATUS=$?

if [[ $PAGE_STATUS -eq 0 ]]; then
    PAGE_SIZE=$(echo "$ATTENDANCE_PAGE" | wc -c)
    echo "✅ 출석 통계 페이지 로드 성공 (크기: $PAGE_SIZE bytes)"
    
    # JavaScript 에러 체크
    if echo "$ATTENDANCE_PAGE" | grep -q "AttendanceStatisticsPage"; then
        echo "✅ React 컴포넌트 포함됨"
    else
        echo "⚠️  React 컴포넌트 감지 안됨"
    fi
else
    echo "❌ 페이지 로드 실패"
fi
echo ""

# 6. 요약 및 문제 진단
echo "=========================================="
echo "진단 요약"
echo "=========================================="
echo ""

# 출석 문제 진단
echo "📊 출석 통계 문제 진단:"
STUDENT_DAYS=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=1&role=STUDENT&academyId=" | jq -r '.attendanceDays')

if [[ "$STUDENT_DAYS" == "0" ]]; then
    echo "  ❌ userId=1에 대한 출석 데이터 없음"
    echo "     → userId=1이 실제 학생 계정인지 확인 필요"
    echo "     → 데이터베이스에 해당 userId의 attendance_records_v3 데이터 존재 여부 확인"
else
    echo "  ✅ userId=1 출석 데이터 존재 ($STUDENT_DAYS일)"
fi
echo ""

# 채점 모델 진단
echo "🤖 숙제 채점 모델 진단:"
if [[ "$CURRENT_MODEL" == "deepseek/deepseek-ocr-2" ]]; then
    echo "  ✅ 모델명 정상: deepseek/deepseek-ocr-2"
elif [[ "$CURRENT_MODEL" == "deepseek-chat" ]]; then
    echo "  ❌ 모델명 수정 필요"
    echo "     현재: deepseek-chat"
    echo "     변경: deepseek/deepseek-ocr-2"
else
    echo "  ⚠️  모델: $CURRENT_MODEL"
fi
echo ""

echo "🔑 환경 변수 진단:"
echo "  필요한 변수: Novita_AI_API"
echo "  → Cloudflare Pages 환경 변수에서 확인 필요"
echo ""

echo "=========================================="
echo "다음 단계"
echo "=========================================="
echo ""

if [[ "$CURRENT_MODEL" != "deepseek/deepseek-ocr-2" ]]; then
    echo "1. 숙제 채점 모델명 수정:"
    echo "   ./update-to-novita-model.sh 실행"
    echo ""
fi

if [[ "$STUDENT_DAYS" == "0" ]]; then
    echo "2. 출석 통계 문제 해결:"
    echo "   - 실제 학생으로 로그인한 상태에서 테스트"
    echo "   - 브라우저 개발자 도구에서 네트워크 요청 확인"
    echo "   - userId 파라미터가 올바르게 전달되는지 확인"
    echo ""
fi

echo "3. 환경 변수 확인:"
echo "   - Cloudflare Pages Dashboard"
echo "   - Settings → Environment variables → Production"
echo "   - Novita_AI_API 키 존재 여부 확인"
echo ""

