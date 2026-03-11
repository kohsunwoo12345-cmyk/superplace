#!/bin/bash
set -e

echo "============================================"
echo "🧪 API 키 재설정 후 전체 테스트"
echo "============================================"
echo ""

# 1. 환경변수 상태 확인
echo "1️⃣ 환경변수 디버그..."
DEBUG_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/debug")
echo "🔍 현재 환경변수 상태:"
echo "$DEBUG_RESPONSE" | jq '{
  hasGeminiKey: .environment.hasGeminiApiKey,
  geminiKeyLength: .environment.geminiKeyLength,
  geminiApiTest: .tests.geminiApi.success,
  geminiApiError: .tests.geminiApi.error
}'
echo ""

# 2. 현재 모델 설정 확인
echo "2️⃣ 현재 채점 설정 확인..."
CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
CURRENT_MODEL=$(echo "$CONFIG" | jq -r '.config.model')
echo "📋 현재 모델: $CURRENT_MODEL"
echo ""

# ===== Gemini 모델 테스트 =====
echo "============================================"
echo "🤖 Gemini 모델 테스트 시작"
echo "============================================"
echo ""

echo "3️⃣ Gemini 모델로 전환..."
UPDATE_GEMINI=$(curl -s -X POST "https://superplacestudy.pages.dev/api/admin/homework-grading-config" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "gemini-2.5-flash",
        "temperature": 0.3,
        "enableRAG": 0
    }')
echo "$UPDATE_GEMINI" | jq -r '"✅ " + .message'
echo ""

echo "4️⃣ Gemini로 테스트 제출..."
GEMINI_SUBMIT=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
    -H "Content-Type: application/json" \
    -d '{
        "userId": 1,
        "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
    }')

GEMINI_SUBMISSION_ID=$(echo "$GEMINI_SUBMIT" | jq -r '.submission.id')
echo "✅ 제출 ID: $GEMINI_SUBMISSION_ID"
echo ""

echo "5️⃣ Gemini 수동 채점 트리거..."
sleep 2
GEMINI_GRADE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/process-grading" \
    -H "Content-Type: application/json" \
    -d "{\"submissionId\": \"$GEMINI_SUBMISSION_ID\"}")

echo "📊 Gemini 채점 결과:"
if echo "$GEMINI_GRADE" | jq -e '.error' > /dev/null 2>&1; then
    echo "❌ 오류 발생:"
    echo "$GEMINI_GRADE" | jq '{error, message}'
    GEMINI_SUCCESS=false
else
    echo "$GEMINI_GRADE" | jq '{success, gradingId, score, subject}'
    GEMINI_SUCCESS=true
fi
echo ""

# ===== DeepSeek 모델 테스트 =====
echo "============================================"
echo "🤖 DeepSeek 모델 테스트 시작"
echo "============================================"
echo ""

echo "6️⃣ DeepSeek 모델로 전환..."
UPDATE_DEEPSEEK=$(curl -s -X POST "https://superplacestudy.pages.dev/api/admin/homework-grading-config" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "deepseek-chat",
        "temperature": 0.2,
        "enableRAG": 0
    }')
echo "$UPDATE_DEEPSEEK" | jq -r '"✅ " + .message'
echo ""

echo "7️⃣ DeepSeek로 테스트 제출..."
DEEPSEEK_SUBMIT=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
    -H "Content-Type: application/json" \
    -d '{
        "userId": 1,
        "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
    }')

DEEPSEEK_SUBMISSION_ID=$(echo "$DEEPSEEK_SUBMIT" | jq -r '.submission.id')
echo "✅ 제출 ID: $DEEPSEEK_SUBMISSION_ID"
echo ""

echo "8️⃣ DeepSeek 수동 채점 트리거..."
sleep 2
DEEPSEEK_GRADE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/process-grading" \
    -H "Content-Type: application/json" \
    -d "{\"submissionId\": \"$DEEPSEEK_SUBMISSION_ID\"}")

echo "📊 DeepSeek 채점 결과:"
if echo "$DEEPSEEK_GRADE" | jq -e '.error' > /dev/null 2>&1; then
    echo "❌ 오류 발생:"
    echo "$DEEPSEEK_GRADE" | jq '{error, message}'
    DEEPSEEK_SUCCESS=false
else
    echo "$DEEPSEEK_GRADE" | jq '{success, gradingId, score, subject}'
    DEEPSEEK_SUCCESS=true
fi
echo ""

# ===== 최종 판정 =====
echo "============================================"
echo "📊 최종 테스트 결과"
echo "============================================"
echo ""

if [ "$GEMINI_SUCCESS" = true ] && [ "$DEEPSEEK_SUCCESS" = true ]; then
    echo "✅✅✅ 모든 테스트 통과!"
    echo ""
    echo "🎉 Gemini 모델: 정상 작동"
    echo "🎉 DeepSeek 모델: 정상 작동"
    echo "🎉 자동 숙제 채점 시스템 완벽 구동"
    echo ""
    echo "다음 단계:"
    echo "1. Admin UI에서 원하는 모델 선택"
    echo "   https://superplacestudy.pages.dev/dashboard/admin/homework-grading-config"
    echo "2. 학생 계정으로 실제 숙제 제출 테스트"
    echo "3. 결과 페이지에서 채점 결과 확인"
    echo "   https://superplacestudy.pages.dev/dashboard/homework-results"
elif [ "$GEMINI_SUCCESS" = true ]; then
    echo "✅ Gemini 모델만 정상 작동"
    echo "❌ DeepSeek 모델 실패 - DEEPSEEK_API_KEY 확인 필요"
elif [ "$DEEPSEEK_SUCCESS" = true ]; then
    echo "✅ DeepSeek 모델만 정상 작동"
    echo "❌ Gemini 모델 실패 - GOOGLE_GEMINI_API_KEY 확인 필요"
else
    echo "❌ 모든 테스트 실패"
    echo ""
    echo "조치 필요:"
    echo "1. Cloudflare Pages → Settings → Environment Variables 확인"
    echo "2. DEEPSEEK_API_KEY 및 GOOGLE_GEMINI_API_KEY 설정 확인"
    echo "3. 저장 후 재배포"
fi

echo ""
echo "============================================"
