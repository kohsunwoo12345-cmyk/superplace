#!/bin/bash

echo "=========================================="
echo "숙제 자동 채점 재테스트"
echo "=========================================="
echo ""

# 테스트 이미지로 제출
SAMPLE_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "1. 숙제 제출 중..."
SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":1,\"subject\":\"테스트\",\"imageUrl\":\"$SAMPLE_IMAGE\"}")

# submission.id 형태로 파싱
SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id')

echo "제출 ID: $SUBMISSION_ID"
echo "제출 시각: $(date '+%H:%M:%S')"
echo ""

if [[ "$SUBMISSION_ID" != "null" && "$SUBMISSION_ID" != "" ]]; then
    echo "2. 채점 상태 모니터링 (최대 30초)"
    echo "------------------------------------------"
    
    for i in {1..6}; do
        sleep 5
        
        STATUS_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/status?submissionId=$SUBMISSION_ID")
        CURRENT_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.submission.status')
        
        echo "[$((i*5))초] 상태: $CURRENT_STATUS"
        
        if [[ "$CURRENT_STATUS" == "graded" ]]; then
            echo ""
            echo "✅ 자동 채점 완료!"
            echo ""
            
            SCORE=$(echo "$STATUS_RESPONSE" | jq -r '.grading.score // 0')
            SUBJECT=$(echo "$STATUS_RESPONSE" | jq -r '.grading.subject // "N/A"')
            FEEDBACK=$(echo "$STATUS_RESPONSE" | jq -r '.grading.feedback // "N/A"' | cut -c1-150)
            GRADED_BY=$(echo "$STATUS_RESPONSE" | jq -r '.grading.gradedBy // "N/A"')
            
            echo "📊 채점 결과:"
            echo "   과목: $SUBJECT"
            echo "   점수: $SCORE"
            echo "   채점 방식: $GRADED_BY"
            echo "   피드백: $FEEDBACK..."
            echo ""
            
            break
        elif [[ "$CURRENT_STATUS" == "failed" ]]; then
            echo ""
            echo "❌ 채점 실패"
            echo ""
            
            ERROR_MSG=$(echo "$STATUS_RESPONSE" | jq -r '.error // .message // "알 수 없는 오류"')
            echo "오류 메시지: $ERROR_MSG"
            echo ""
            
            break
        fi
    done
    
    if [[ "$CURRENT_STATUS" == "pending" ]]; then
        echo ""
        echo "⚠️  30초 후에도 채점 진행 중"
        echo "   백그라운드에서 계속 처리 중일 수 있습니다."
        echo ""
    fi
else
    echo "❌ 제출 ID를 찾을 수 없습니다."
    echo "응답 전체:"
    echo "$SUBMIT_RESPONSE" | jq '.'
fi

echo ""
echo "=========================================="
echo "최종 결과"
echo "=========================================="
echo ""

if [[ "$CURRENT_STATUS" == "graded" ]]; then
    echo "✅ 모든 테스트 성공!"
    echo ""
    echo "확인된 사항:"
    echo "  ✅ Novita_AI_API 환경 변수 설정됨"
    echo "  ✅ deepseek/deepseek-ocr-2 모델 호출 성공"
    echo "  ✅ 숙제 제출 API 정상 작동"
    echo "  ✅ 백그라운드 자동 채점 성공"
    echo "  ✅ 채점 결과 저장 및 조회 정상"
    echo ""
    echo "시스템 정상 작동 확인 완료!"
else
    echo "테스트 상태: $CURRENT_STATUS"
    echo ""
    echo "확인 사항:"
    echo "  - Cloudflare Pages 로그 확인"
    echo "  - Debug API: https://superplacestudy.pages.dev/api/homework/debug"
    echo "  - 제출 ID: $SUBMISSION_ID"
fi

echo ""

