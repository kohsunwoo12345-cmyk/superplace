#!/bin/bash
set -e

echo "============================================"
echo "🔐 API 키 환경변수 확인 테스트"
echo "============================================"
echo ""

# 1. 현재 설정된 채점 모델 확인
echo "1️⃣ 현재 채점 설정 확인 중..."
CONFIG_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
echo "📋 현재 설정:"
echo "$CONFIG_RESPONSE" | jq -r '.config | "모델: \(.model), 온도: \(.temperature), RAG: \(.enableRAG)"'
CURRENT_MODEL=$(echo "$CONFIG_RESPONSE" | jq -r '.config.model')
echo ""

# 2. Debug API로 환경변수 상태 확인
echo "2️⃣ 환경변수 상태 디버그..."
DEBUG_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/debug")
echo "🔍 환경변수 진단:"
echo "$DEBUG_RESPONSE" | jq '.'
echo ""

# 3. 모델별 API 키 요구사항 안내
echo "3️⃣ 필요한 환경변수:"
if [[ "$CURRENT_MODEL" == deepseek* ]]; then
    echo "✅ DeepSeek 모델 선택됨 → DEEPSEEK_API_KEY 필요"
    echo "   (https://platform.deepseek.com 에서 발급)"
elif [[ "$CURRENT_MODEL" == gemini* ]]; then
    echo "✅ Gemini 모델 선택됨 → GOOGLE_GEMINI_API_KEY 필요"
    echo "   (https://aistudio.google.com/app/apikey 에서 발급)"
fi
echo ""

# 4. 실제 채점 시도
echo "4️⃣ 실제 채점 테스트 중..."
SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
    -H "Content-Type: application/json" \
    -d '{
        "userId": 1,
        "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
    }')

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submissionId // empty')
if [ -z "$SUBMISSION_ID" ]; then
    echo "❌ 제출 실패: $SUBMIT_RESPONSE"
    exit 1
fi

echo "✅ 제출 성공: $SUBMISSION_ID"
echo ""

# 5. 수동 채점 트리거로 API 키 확인
echo "5️⃣ 수동 채점 트리거로 API 키 상태 확인..."
sleep 2
GRADING_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/process-grading" \
    -H "Content-Type: application/json" \
    -d "{\"submissionId\": \"$SUBMISSION_ID\"}")

echo "📊 채점 결과:"
echo "$GRADING_RESPONSE" | jq '.'
echo ""

# 6. 최종 판정
if echo "$GRADING_RESPONSE" | jq -e '.error' > /dev/null; then
    ERROR_MSG=$(echo "$GRADING_RESPONSE" | jq -r '.error')
    if [[ "$ERROR_MSG" == *"not configured"* ]] || [[ "$ERROR_MSG" == *"leaked"* ]] || [[ "$ERROR_MSG" == *"403"* ]]; then
        echo "❌ API 키 문제 발견!"
        echo ""
        echo "📝 해결 방법:"
        echo "1. Cloudflare Pages 대시보드 접속"
        echo "2. superplacestudy 프로젝트 → Settings → Environment Variables"
        echo "3. Production 환경에 다음 변수 추가:"
        if [[ "$CURRENT_MODEL" == deepseek* ]]; then
            echo "   변수명: DEEPSEEK_API_KEY"
            echo "   값: sk-xxxxxxxxxxxxxxxx (DeepSeek API 키)"
        else
            echo "   변수명: GOOGLE_GEMINI_API_KEY"
            echo "   값: AIzaxxxxxxxxxxxxxxxx (Gemini API 키)"
        fi
        echo "4. 저장 후 재배포"
        exit 1
    fi
else
    echo "✅ API 키 정상 작동!"
    echo "✅ 자동 채점 시스템 준비 완료!"
fi

echo ""
echo "============================================"
