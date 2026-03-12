#!/bin/bash

echo "=========================================="
echo "숙제 검사 프롬프트 작동 확인"
echo "=========================================="
echo ""

# 1. 현재 프롬프트 확인
echo "1. 현재 설정된 프롬프트 확인"
echo "------------------------------------------"
GRADING_CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
SYSTEM_PROMPT=$(echo "$GRADING_CONFIG" | jq -r '.config.systemPrompt')
CURRENT_MODEL=$(echo "$GRADING_CONFIG" | jq -r '.config.model')

echo "모델: $CURRENT_MODEL"
echo ""
echo "시스템 프롬프트 (처음 200자):"
echo "$SYSTEM_PROMPT" | cut -c1-200
echo "..."
echo ""
echo "프롬프트 길이: ${#SYSTEM_PROMPT} 자"
echo ""

# 2. 프롬프트 키워드 체크
echo "2. 프롬프트 내 주요 키워드 확인"
echo "------------------------------------------"
echo "✓ '문제 분석' 포함: $(echo "$SYSTEM_PROMPT" | grep -c '문제')"
echo "✓ '채점' 포함: $(echo "$SYSTEM_PROMPT" | grep -c '채점')"
echo "✓ 'JSON' 포함: $(echo "$SYSTEM_PROMPT" | grep -c 'JSON')"
echo "✓ 'problemAnalysis' 포함: $(echo "$SYSTEM_PROMPT" | grep -c 'problemAnalysis')"
echo "✓ '정답' 포함: $(echo "$SYSTEM_PROMPT" | grep -c '정답')"
echo ""

# 3. 실제 숙제 제출 및 채점 테스트
echo "3. 실제 채점 테스트"
echo "------------------------------------------"

# 간단한 수학 문제 이미지 제출 (테스트용 작은 이미지)
SAMPLE_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "테스트 숙제 제출 중..."
SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":1,\"subject\":\"수학\",\"imageUrl\":\"$SAMPLE_IMAGE\"}")

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id')
echo "제출 ID: $SUBMISSION_ID"
echo ""

if [[ "$SUBMISSION_ID" != "null" && "$SUBMISSION_ID" != "" ]]; then
    echo "⏳ 채점 대기 중 (최대 40초)..."
    echo ""
    
    # 5초 간격으로 최대 8번 체크 (총 40초)
    for i in {1..8}; do
        sleep 5
        
        # 직접 DB에서 채점 결과 조회
        CHECK_RESULT=$(curl -s "https://superplacestudy.pages.dev/api/homework/check-grading?submissionId=$SUBMISSION_ID")
        
        GRADING_EXISTS=$(echo "$CHECK_RESULT" | jq -r '.exists // false')
        
        echo "   [$((i*5))초] 채점 완료 여부: $GRADING_EXISTS"
        
        if [[ "$GRADING_EXISTS" == "true" ]]; then
            echo ""
            echo "✅ 채점 완료!"
            echo ""
            
            # 채점 결과 상세 확인
            SCORE=$(echo "$CHECK_RESULT" | jq -r '.grading.score // 0')
            SUBJECT=$(echo "$CHECK_RESULT" | jq -r '.grading.subject // "N/A"')
            FEEDBACK=$(echo "$CHECK_RESULT" | jq -r '.grading.feedback // "N/A"')
            TOTAL_Q=$(echo "$CHECK_RESULT" | jq -r '.grading.totalQuestions // 0')
            CORRECT_A=$(echo "$CHECK_RESULT" | jq -r '.grading.correctAnswers // 0')
            
            # problemAnalysis 확인
            PROBLEM_ANALYSIS=$(echo "$CHECK_RESULT" | jq -r '.grading.problemAnalysis // "null"')
            ANALYSIS_COUNT=0
            
            if [[ "$PROBLEM_ANALYSIS" != "null" && "$PROBLEM_ANALYSIS" != "[]" ]]; then
                ANALYSIS_COUNT=$(echo "$PROBLEM_ANALYSIS" | jq '. | length' 2>/dev/null || echo "0")
            fi
            
            echo "📊 채점 결과:"
            echo "   과목: $SUBJECT"
            echo "   점수: $SCORE"
            echo "   전체 문제: $TOTAL_Q"
            echo "   정답: $CORRECT_A"
            echo "   문제별 분석: $ANALYSIS_COUNT개"
            echo ""
            echo "피드백:"
            echo "$FEEDBACK" | fold -w 70 | head -5
            echo ""
            
            if [[ $ANALYSIS_COUNT -gt 0 ]]; then
                echo "✅ problemAnalysis 포함됨!"
                echo ""
                echo "문제별 분석 샘플:"
                echo "$PROBLEM_ANALYSIS" | jq '.[0] | {problem: .problem, isCorrect: .isCorrect, explanation: .explanation}' 2>/dev/null || echo "파싱 오류"
            else
                echo "❌ problemAnalysis가 비어있거나 없습니다!"
            fi
            echo ""
            
            break
        fi
    done
    
    if [[ "$GRADING_EXISTS" != "true" ]]; then
        echo ""
        echo "⚠️  40초 후에도 채점이 완료되지 않았습니다."
        echo "   백그라운드에서 계속 진행 중이거나 오류가 발생했을 수 있습니다."
        echo ""
    fi
else
    echo "❌ 제출 실패"
fi

echo ""
echo "=========================================="
echo "진단 결과"
echo "=========================================="
echo ""

if [[ "$GRADING_EXISTS" == "true" ]]; then
    echo "프롬프트 작동 상태:"
    
    if [[ $TOTAL_Q -gt 0 ]]; then
        echo "  ✅ 전체 문제 수 감지됨: $TOTAL_Q"
    else
        echo "  ⚠️  전체 문제 수가 0입니다"
    fi
    
    if [[ $ANALYSIS_COUNT -gt 0 ]]; then
        echo "  ✅ 문제별 분석 생성됨: $ANALYSIS_COUNT개"
    else
        echo "  ❌ 문제별 분석이 없습니다"
        echo "     → 프롬프트에서 problemAnalysis 요구가 제대로 전달되지 않았을 수 있음"
    fi
    
    if [[ -n "$FEEDBACK" && "$FEEDBACK" != "N/A" ]]; then
        echo "  ✅ 피드백 생성됨"
    else
        echo "  ⚠️  피드백이 없습니다"
    fi
else
    echo "❌ 채점이 완료되지 않아 프롬프트 작동 여부를 확인할 수 없습니다"
fi

echo ""
echo "확인 필요 사항:"
echo "1. functions/api/homework/process-grading.ts에서 프롬프트 사용 확인"
echo "2. Cloudflare Pages 로그에서 AI 응답 확인"
echo "3. DB에서 실제 저장된 채점 결과 확인"
echo ""

