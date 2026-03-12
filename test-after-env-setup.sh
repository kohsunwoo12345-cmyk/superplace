#!/bin/bash

echo "=========================================="
echo "환경 변수 설정 후 전체 시스템 테스트"
echo "2026-03-12"
echo "=========================================="
echo ""

echo "⏳ Cloudflare Pages 재배포 대기 (90초)..."
sleep 90
echo ""

# 1. 환경 변수 확인
echo "=========================================="
echo "1. 환경 변수 상태 확인"
echo "=========================================="
DEBUG_INFO=$(curl -s "https://superplacestudy.pages.dev/api/homework/debug")

HAS_NOVITA=$(echo "$DEBUG_INFO" | jq -r '.environment.hasNovitaApiKey')
NOVITA_LENGTH=$(echo "$DEBUG_INFO" | jq -r '.environment.novitaKeyLength')

echo "Novita_AI_API 설정 여부: $HAS_NOVITA"
if [[ "$HAS_NOVITA" == "true" ]]; then
    echo "✅ Novita_AI_API 환경 변수 설정됨 (길이: $NOVITA_LENGTH)"
else
    echo "❌ Novita_AI_API 환경 변수 미설정"
fi
echo ""

# 2. 채점 모델 설정 확인
echo "=========================================="
echo "2. 숙제 채점 모델 설정 확인"
echo "=========================================="
GRADING_CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
CURRENT_MODEL=$(echo "$GRADING_CONFIG" | jq -r '.config.model')

echo "현재 모델: $CURRENT_MODEL"

if [[ "$CURRENT_MODEL" == "deepseek/deepseek-ocr-2" ]]; then
    echo "✅ 모델명 정상: deepseek/deepseek-ocr-2"
else
    echo "⚠️  예상과 다른 모델: $CURRENT_MODEL"
fi
echo ""

# 3. 출석 통계 API 테스트
echo "=========================================="
echo "3. 출석 통계 API 테스트"
echo "=========================================="

STUDENT_ID="student-1772865101424-12ldfjns29zg"
STUDENT_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/attendance/statistics?userId=$STUDENT_ID&role=STUDENT&academyId=")

ATTENDANCE_DAYS=$(echo "$STUDENT_RESPONSE" | jq -r '.attendanceDays')
HAS_VERIFIED=$(echo "$STUDENT_RESPONSE" | jq -r '.calendar | to_entries[] | select(.value == "VERIFIED") | .key' | wc -l)

echo "학생 출석 일수: $ATTENDANCE_DAYS일"
echo "VERIFIED 상태 레코드: $HAS_VERIFIED개"

if [[ "$ATTENDANCE_DAYS" != "0" && "$HAS_VERIFIED" -gt 0 ]]; then
    echo "✅ 출석 통계 API 정상 작동"
else
    echo "⚠️  출석 데이터 없음"
fi
echo ""

# 4. 숙제 제출 및 자동 채점 테스트
echo "=========================================="
echo "4. 숙제 자동 채점 플로우 테스트"
echo "=========================================="

if [[ "$HAS_NOVITA" == "true" && "$CURRENT_MODEL" == "deepseek/deepseek-ocr-2" ]]; then
    echo "환경 준비 완료. 테스트 숙제 제출 중..."
    echo ""
    
    # 작은 녹색 테스트 이미지 (1x1 픽셀)
    SAMPLE_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
      -H "Content-Type: application/json" \
      -d "{\"userId\":1,\"subject\":\"테스트\",\"imageUrl\":\"$SAMPLE_IMAGE\"}")
    
    SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submissionId')
    
    if [[ "$SUBMISSION_ID" != "null" && "$SUBMISSION_ID" != "" ]]; then
        echo "✅ 숙제 제출 성공"
        echo "   제출 ID: $SUBMISSION_ID"
        echo "   제출 시각: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        
        echo "⏳ 백그라운드 채점 대기 중..."
        
        # 5초 간격으로 최대 30초 동안 상태 체크
        for i in {1..6}; do
            sleep 5
            
            GRADING_STATUS=$(curl -s "https://superplacestudy.pages.dev/api/homework/status?submissionId=$SUBMISSION_ID")
            CURRENT_STATUS=$(echo "$GRADING_STATUS" | jq -r '.submission.status')
            
            echo "   [$((i*5))초] 상태: $CURRENT_STATUS"
            
            if [[ "$CURRENT_STATUS" == "graded" ]]; then
                echo ""
                echo "✅ 자동 채점 완료!"
                echo ""
                
                SCORE=$(echo "$GRADING_STATUS" | jq -r '.grading.score // "N/A"')
                SUBJECT=$(echo "$GRADING_STATUS" | jq -r '.grading.subject // "N/A"')
                FEEDBACK=$(echo "$GRADING_STATUS" | jq -r '.grading.feedback // "N/A"' | cut -c1-100)
                
                echo "📊 채점 결과:"
                echo "   - 과목: $SUBJECT"
                echo "   - 점수: $SCORE"
                echo "   - 피드백: $FEEDBACK..."
                echo ""
                
                break
            elif [[ "$CURRENT_STATUS" == "failed" ]]; then
                echo ""
                echo "❌ 채점 실패"
                
                ERROR_MSG=$(echo "$GRADING_STATUS" | jq -r '.error // .message // "알 수 없는 오류"')
                echo "   오류 메시지: $ERROR_MSG"
                echo ""
                
                break
            fi
        done
        
        if [[ "$CURRENT_STATUS" == "pending" ]]; then
            echo ""
            echo "⚠️  채점이 30초 이상 소요되고 있습니다."
            echo "   백그라운드에서 계속 진행 중일 수 있습니다."
            echo ""
        fi
    else
        echo "❌ 숙제 제출 실패"
        echo "   응답: $SUBMIT_RESPONSE"
    fi
else
    echo "❌ 테스트 스킵 - 환경 설정 불완전"
    if [[ "$HAS_NOVITA" != "true" ]]; then
        echo "   - Novita_AI_API 미설정"
    fi
    if [[ "$CURRENT_MODEL" != "deepseek/deepseek-ocr-2" ]]; then
        echo "   - 모델이 deepseek/deepseek-ocr-2가 아님"
    fi
fi
echo ""

# 5. 최종 요약
echo "=========================================="
echo "최종 테스트 결과 요약"
echo "=========================================="
echo ""

echo "📊 출석 통계 시스템:"
if [[ "$ATTENDANCE_DAYS" != "0" && "$HAS_VERIFIED" -gt 0 ]]; then
    echo "  ✅ API 정상 작동"
    echo "  ✅ Status 매핑 정상 (PRESENT → VERIFIED)"
    echo "  ✅ 학생 데이터 정상 표시 ($ATTENDANCE_DAYS일)"
else
    echo "  ⚠️  데이터 없음 (실제 학생 계정 필요)"
fi
echo ""

echo "🤖 숙제 채점 시스템:"
echo "  모델: $CURRENT_MODEL"
echo "  환경 변수: $([ "$HAS_NOVITA" == "true" ] && echo "✅ 설정됨" || echo "❌ 미설정")"

if [[ "$CURRENT_STATUS" == "graded" ]]; then
    echo "  ✅ 자동 채점 성공!"
    echo "  ✅ Novita AI API 정상 작동"
    echo "  ✅ deepseek/deepseek-ocr-2 모델 호출 성공"
elif [[ "$CURRENT_STATUS" == "failed" ]]; then
    echo "  ❌ 채점 실패 (로그 확인 필요)"
elif [[ "$CURRENT_STATUS" == "pending" ]]; then
    echo "  ⏳ 채점 진행 중 (백그라운드)"
elif [[ -z "$SUBMISSION_ID" ]]; then
    echo "  ❌ 제출 실패"
else
    echo "  ⚠️  테스트 미실행"
fi
echo ""

echo "=========================================="
echo "다음 단계"
echo "=========================================="
echo ""

if [[ "$CURRENT_STATUS" == "graded" ]]; then
    echo "✅ 모든 시스템이 정상 작동합니다!"
    echo ""
    echo "실제 사용자 테스트:"
    echo "1. 학생 계정으로 로그인"
    echo "   https://superplacestudy.pages.dev"
    echo ""
    echo "2. 출석 통계 확인"
    echo "   https://superplacestudy.pages.dev/dashboard/attendance-statistics/"
    echo ""
    echo "3. 실제 숙제 이미지로 채점 테스트"
    echo "   https://superplacestudy.pages.dev/dashboard/homework"
else
    echo "문제 해결 단계:"
    
    if [[ "$HAS_NOVITA" != "true" ]]; then
        echo "1. Cloudflare Pages에서 Novita_AI_API 환경 변수 확인"
        echo "   - 변수명이 정확한지 확인: Novita_AI_API (대소문자 주의)"
        echo "   - 저장 후 재배포되었는지 확인"
    fi
    
    if [[ "$CURRENT_STATUS" == "failed" ]]; then
        echo "2. Cloudflare Pages 로그 확인"
        echo "   https://dash.cloudflare.com"
        echo "   Workers & Pages → superplace → Logs"
    fi
    
    echo ""
    echo "3. Debug API로 상세 정보 확인"
    echo "   https://superplacestudy.pages.dev/api/homework/debug"
fi
echo ""

echo "=========================================="
echo "테스트 완료: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

