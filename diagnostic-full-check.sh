#!/bin/bash

echo "=========================================="
echo "전체 진단 스크립트 - 2026-03-12"
echo "=========================================="
echo ""

# 1. 출석 통계 API 체크 (학생)
echo "1. 출석 통계 API 체크 (학생 userId=1)"
echo "------------------------------------------"
ATTENDANCE_STUDENT=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=1&role=STUDENT&academyId=")
echo "$ATTENDANCE_STUDENT" | jq '.' 2>/dev/null || echo "$ATTENDANCE_STUDENT"
echo ""

# 2. 출석 통계 API 체크 (관리자)
echo "2. 출석 통계 API 체크 (관리자 role=ADMIN)"
echo "------------------------------------------"
ATTENDANCE_ADMIN=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=1&role=ADMIN&academyId=1")
echo "$ATTENDANCE_ADMIN" | jq '.' 2>/dev/null || echo "$ATTENDANCE_ADMIN"
echo ""

# 3. 출석 DB 직접 체크 API
echo "3. 출석 레코드 직접 확인 (/api/admin/check-attendance-data)"
echo "------------------------------------------"
ATTENDANCE_CHECK=$(curl -s "https://superplacestudy.pages.dev/api/admin/check-attendance-data")
echo "$ATTENDANCE_CHECK" | jq '.records[0:3]' 2>/dev/null || echo "$ATTENDANCE_CHECK"
echo ""

# 4. 현재 채점 설정 확인
echo "4. 숙제 채점 설정 확인"
echo "------------------------------------------"
GRADING_CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
CURRENT_MODEL=$(echo "$GRADING_CONFIG" | jq -r '.config.model')
echo "현재 모델: $CURRENT_MODEL"
echo "$GRADING_CONFIG" | jq '.config | {model, temperature, enableRAG}' 2>/dev/null
echo ""

# 5. 환경 변수 체크
echo "5. 환경 변수 상태 확인"
echo "------------------------------------------"
DEBUG_INFO=$(curl -s "https://superplacestudy.pages.dev/api/homework/debug")
echo "$DEBUG_INFO" | jq '.env' 2>/dev/null || echo "$DEBUG_INFO"
echo ""

# 6. DeepSeek 모델 테스트 (모델명 확인)
echo "6. DeepSeek 모델 유효성 체크"
echo "------------------------------------------"
if [[ "$CURRENT_MODEL" == "deepseek-ocr-2" ]]; then
    echo "❌ 문제: 모델명이 'deepseek-ocr-2'로 설정되어 있습니다."
    echo "   올바른 모델명: 'deepseek-chat'"
    echo "   수정 필요: Admin Config 페이지에서 모델을 'deepseek-chat'으로 변경하세요."
else
    echo "✅ 모델명: $CURRENT_MODEL"
fi
echo ""

# 7. 숙제 제출 및 채점 테스트
echo "7. 숙제 제출 및 채점 플로우 테스트"
echo "------------------------------------------"
SAMPLE_IMAGE="https://raw.githubusercontent.com/user/sample/main/homework-sample.jpg"

SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":1,\"subject\":\"수학\",\"imageUrl\":\"$SAMPLE_IMAGE\"}")

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submissionId' 2>/dev/null)
echo "제출 ID: $SUBMISSION_ID"

if [[ "$SUBMISSION_ID" != "null" && "$SUBMISSION_ID" != "" ]]; then
    echo "⏳ 10초 대기 후 채점 상태 확인..."
    sleep 10
    
    GRADING_STATUS=$(curl -s "https://superplacestudy.pages.dev/api/homework/status?submissionId=$SUBMISSION_ID")
    echo "$GRADING_STATUS" | jq '.' 2>/dev/null || echo "$GRADING_STATUS"
else
    echo "❌ 제출 실패"
fi
echo ""

# 8. 요약
echo "=========================================="
echo "진단 요약"
echo "=========================================="
echo ""
echo "출석 통계 문제:"
STUDENT_DAYS=$(echo "$ATTENDANCE_STUDENT" | jq -r '.attendanceDays' 2>/dev/null)
if [[ "$STUDENT_DAYS" == "0" ]]; then
    echo "  ❌ 학생 출석 데이터가 0입니다."
    echo "     - attendance_records_v3 테이블에 데이터가 있는지 확인 필요"
    echo "     - API 쿼리에서 WHERE 조건이 올바른지 확인 필요"
else
    echo "  ✅ 학생 출석 데이터 정상 ($STUDENT_DAYS일)"
fi
echo ""

echo "숙제 채점 문제:"
if [[ "$CURRENT_MODEL" == "deepseek-ocr-2" ]]; then
    echo "  ❌ 모델명 오류: 'deepseek-ocr-2' → 'deepseek-chat'로 변경 필요"
else
    echo "  ✅ 모델명 정상: $CURRENT_MODEL"
fi

HAS_DEEPSEEK_KEY=$(echo "$DEBUG_INFO" | jq -r '.env.hasDeepSeekApiKey' 2>/dev/null)
if [[ "$HAS_DEEPSEEK_KEY" == "true" ]]; then
    echo "  ✅ DEEPSEEK_API_KEY 설정됨"
else
    echo "  ❌ DEEPSEEK_API_KEY 미설정"
fi
echo ""

echo "다음 단계:"
echo "1. 출석: attendance_records_v3 테이블 데이터 확인 및 API 수정"
echo "2. 채점: Admin Config에서 모델을 'deepseek-chat'으로 변경"
echo "3. 재테스트"
echo ""

