#!/bin/bash
echo "🔄 DeepSeek OCR2 모델로 전환 중..."

# DeepSeek 모델로 변경
UPDATE_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/admin/homework-grading-config" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "deepseek-chat",
        "temperature": 0.2,
        "enableRAG": 0
    }')

echo "✅ 설정 업데이트:"
echo "$UPDATE_RESPONSE" | jq '.'
echo ""

# 확인
CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
echo "📋 현재 설정:"
echo "$CONFIG" | jq -r '.config | "모델: \(.model), 온도: \(.temperature)"'
echo ""

# 테스트 제출
echo "🧪 테스트 제출 중..."
SUBMIT=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
    -H "Content-Type: application/json" \
    -d '{
        "userId": 1,
        "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
    }')

SUBMISSION_ID=$(echo "$SUBMIT" | jq -r '.submission.id')
echo "✅ 제출 ID: $SUBMISSION_ID"
echo ""

# 수동 채점 시도
echo "⚡ 수동 채점 트리거..."
sleep 2
GRADE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/process-grading" \
    -H "Content-Type: application/json" \
    -d "{\"submissionId\": \"$SUBMISSION_ID\"}")

echo "📊 채점 결과:"
echo "$GRADE" | jq '.'
echo ""

# 판정
if echo "$GRADE" | jq -e '.error' > /dev/null 2>&1; then
    ERROR=$(echo "$GRADE" | jq -r '.error')
    if [[ "$ERROR" == *"DEEPSEEK_API_KEY"* ]] || [[ "$ERROR" == *"not configured"* ]]; then
        echo "❌ DEEPSEEK_API_KEY가 설정되지 않았습니다."
        echo ""
        echo "📝 해결 방법:"
        echo "1. https://platform.deepseek.com 에서 API 키 발급"
        echo "2. Cloudflare Pages → superplacestudy → Settings → Environment Variables"
        echo "3. Production 환경에 추가:"
        echo "   변수명: DEEPSEEK_API_KEY"
        echo "   값: sk-xxxxxxxxxxxxxxxx"
        echo "4. 저장 후 재배포"
    else
        echo "❌ 기타 오류: $ERROR"
    fi
elif echo "$GRADE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅✅✅ DeepSeek API 키 정상 작동!"
    echo "✅ 자동 채점 시스템 준비 완료!"
else
    echo "⚠️ 예상치 못한 응답 형식"
fi
