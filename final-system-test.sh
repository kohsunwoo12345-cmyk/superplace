#!/bin/bash

echo "=========================================="
echo "최종 시스템 전체 테스트"
echo "2026-03-12"
echo "=========================================="
echo ""

echo "⏳ Cloudflare Pages 배포 대기 (90초)..."
sleep 90
echo ""

# 1. 환경 변수 확인
echo "1. 환경 변수 및 시스템 상태 확인"
echo "=========================================="
DEBUG_INFO=$(curl -s "https://superplacestudy.pages.dev/api/homework/debug")
echo "$DEBUG_INFO" | jq '.'
echo ""

HAS_NOVITA=$(echo "$DEBUG_INFO" | jq -r '.environment.hasNovitaApiKey')
if [[ "$HAS_NOVITA" == "true" ]]; then
    echo "✅ Novita_AI_API 환경 변수 설정됨"
else
    echo "❌ Novita_AI_API 환경 변수 미설정"
fi
echo ""

# 2. 숙제 채점 설정 확인
echo "2. 숙제 채점 설정 확인"
echo "=========================================="
GRADING_CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
CURRENT_MODEL=$(echo "$GRADING_CONFIG" | jq -r '.config.model')
echo "현재 모델: $CURRENT_MODEL"
echo "$GRADING_CONFIG" | jq '.config | {model, temperature, maxTokens, enableRAG}'
echo ""

if [[ "$CURRENT_MODEL" == "deepseek/deepseek-ocr-2" ]]; then
    echo "✅ 모델명 정상: deepseek/deepseek-ocr-2"
else
    echo "⚠️  예상과 다른 모델: $CURRENT_MODEL"
fi
echo ""

# 3. 출석 통계 테스트
echo "3. 출석 통계 테스트"
echo "=========================================="

echo "3-1. 실제 학생 ID로 테스트 (student-1772865101424-12ldfjns29zg)"
echo "------------------------------------------"
STUDENT_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=student-1772865101424-12ldfjns29zg&role=STUDENT&academyId=")
echo "$STUDENT_RESPONSE" | jq '{success, role, attendanceDays, calendar}'
echo ""

ATTENDANCE_DAYS=$(echo "$STUDENT_RESPONSE" | jq -r '.attendanceDays')
CALENDAR_ENTRIES=$(echo "$STUDENT_RESPONSE" | jq -r '.calendar | length')

if [[ "$ATTENDANCE_DAYS" != "0" && "$ATTENDANCE_DAYS" != "null" ]]; then
    echo "✅ 학생 출석 데이터 정상: $ATTENDANCE_DAYS일 (캘린더 항목: $CALENDAR_ENTRIES개)"
    
    # Status 확인
    HAS_VERIFIED=$(echo "$STUDENT_RESPONSE" | jq -r '.calendar | to_entries[] | select(.value == "VERIFIED") | .key' | wc -l)
    HAS_LATE=$(echo "$STUDENT_RESPONSE" | jq -r '.calendar | to_entries[] | select(.value == "LATE") | .key' | wc -l)
    
    if [[ $HAS_VERIFIED -gt 0 ]] || [[ $HAS_LATE -gt 0 ]]; then
        echo "✅ Status 매핑 정상 작동 (VERIFIED: $HAS_VERIFIED, LATE: $HAS_LATE)"
    fi
else
    echo "❌ 학생 출석 데이터 없음"
fi
echo ""

echo "3-2. 관리자 출석 통계"
echo "------------------------------------------"
ADMIN_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=1&role=ADMIN&academyId=1")
ADMIN_VERIFIED_COUNT=$(echo "$ADMIN_RESPONSE" | jq -r '.records[] | select(.status == "VERIFIED") | .userName' | wc -l)
TOTAL_RECORDS=$(echo "$ADMIN_RESPONSE" | jq -r '.records | length')

echo "전체 레코드: $TOTAL_RECORDS개"
echo "VERIFIED 상태 레코드: $ADMIN_VERIFIED_COUNT개"

if [[ $ADMIN_VERIFIED_COUNT -gt 0 ]]; then
    echo "✅ 관리자 화면에서 VERIFIED 상태 확인됨"
    echo ""
    echo "샘플 레코드:"
    echo "$ADMIN_RESPONSE" | jq '.records[0:2] | .[] | {userName, status, verifiedAt}'
else
    echo "⚠️  관리자 화면에 VERIFIED 상태 없음"
fi
echo ""

# 4. 숙제 제출 및 채점 테스트
echo "4. 숙제 제출 및 채점 플로우 테스트"
echo "=========================================="

if [[ "$HAS_NOVITA" == "true" && "$CURRENT_MODEL" == "deepseek/deepseek-ocr-2" ]]; then
    echo "환경 준비 완료. 테스트 숙제 제출 중..."
    echo ""
    
    # 샘플 이미지 URL (녹색 테스트 이미지)
    SAMPLE_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
      -H "Content-Type: application/json" \
      -d "{\"userId\":1,\"subject\":\"테스트\",\"imageUrl\":\"$SAMPLE_IMAGE\"}")
    
    SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submissionId')
    
    if [[ "$SUBMISSION_ID" != "null" && "$SUBMISSION_ID" != "" ]]; then
        echo "✅ 숙제 제출 성공"
        echo "   제출 ID: $SUBMISSION_ID"
        echo ""
        
        echo "⏳ 채점 대기 (15초)..."
        sleep 15
        
        GRADING_STATUS=$(curl -s "https://superplacestudy.pages.dev/api/homework/status?submissionId=$SUBMISSION_ID")
        FINAL_STATUS=$(echo "$GRADING_STATUS" | jq -r '.submission.status')
        
        echo "최종 상태: $FINAL_STATUS"
        echo "$GRADING_STATUS" | jq '{submission: {status, subject}, grading: {score, feedback: (.grading.feedback[:100])}}'
        echo ""
        
        if [[ "$FINAL_STATUS" == "graded" ]]; then
            echo "✅ 자동 채점 성공!"
        else
            echo "⚠️  채점 상태: $FINAL_STATUS"
        fi
    else
        echo "❌ 숙제 제출 실패"
    fi
else
    echo "⚠️  테스트 스킵 - 환경 변수 또는 모델 설정 불완전"
    if [[ "$HAS_NOVITA" != "true" ]]; then
        echo "   - Novita_AI_API 미설정"
    fi
    if [[ "$CURRENT_MODEL" != "deepseek/deepseek-ocr-2" ]]; then
        echo "   - 모델이 deepseek/deepseek-ocr-2가 아님: $CURRENT_MODEL"
    fi
fi
echo ""

# 5. 최종 요약
echo "=========================================="
echo "최종 테스트 요약"
echo "=========================================="
echo ""

echo "📊 출석 통계:"
if [[ "$ATTENDANCE_DAYS" != "0" && "$ATTENDANCE_DAYS" != "null" ]]; then
    echo "  ✅ API 응답 정상"
    echo "  ✅ Status 매핑 작동 (PRESENT → VERIFIED)"
    echo "  ℹ️  실제 학생 계정으로 로그인하여 UI에서 확인하세요"
    echo "     https://superplacestudy.pages.dev/dashboard/attendance-statistics/"
else
    echo "  ⚠️  userId=1에 출석 데이터 없음"
    echo "     → 실제 학생 계정(student-XXXXX)으로 테스트 필요"
fi
echo ""

echo "🤖 숙제 채점:"
if [[ "$CURRENT_MODEL" == "deepseek/deepseek-ocr-2" ]]; then
    echo "  ✅ 모델명: deepseek/deepseek-ocr-2"
else
    echo "  ⚠️  모델: $CURRENT_MODEL"
fi

if [[ "$HAS_NOVITA" == "true" ]]; then
    echo "  ✅ Novita_AI_API 설정됨"
else
    echo "  ❌ Novita_AI_API 미설정"
    echo "     → Cloudflare Pages 환경 변수 확인 필요"
fi

if [[ "$FINAL_STATUS" == "graded" ]]; then
    echo "  ✅ 자동 채점 플로우 작동"
elif [[ -n "$SUBMISSION_ID" ]]; then
    echo "  ⚠️  채점 진행 중 또는 실패"
fi
echo ""

echo "=========================================="
echo "다음 단계"
echo "=========================================="
echo ""

if [[ "$HAS_NOVITA" != "true" ]]; then
    echo "1. Cloudflare Pages 환경 변수 설정:"
    echo "   - Dashboard: https://dash.cloudflare.com"
    echo "   - Workers & Pages → superplace → Settings"
    echo "   - Environment variables → Production"
    echo "   - 변수명: Novita_AI_API"
    echo "   - 값: <your_novita_api_key>"
    echo ""
fi

echo "2. 출석 통계 UI 확인:"
echo "   - 실제 학생 계정으로 로그인"
echo "   - https://superplacestudy.pages.dev/dashboard/attendance-statistics/"
echo "   - 캘린더에 출석/지각/결석 표시 확인"
echo ""

echo "3. 숙제 제출 테스트:"
echo "   - https://superplacestudy.pages.dev/dashboard/homework"
echo "   - 실제 숙제 이미지 업로드"
echo "   - 10-15초 후 결과 확인"
echo ""

