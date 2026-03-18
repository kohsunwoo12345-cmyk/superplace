#!/bin/bash
echo "⏳ Cloudflare Pages 배포 대기 중... (2분)"
sleep 120

echo ""
echo "🧪 상세 로깅이 추가된 API 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BOT_ID="bot-1773803533575-qrn2pluec"

# Test 1: 학생 계정 - 첫 메시지
echo "📝 Test 1: 학생 계정 - 첫 메시지 (로깅 확인)"
RESPONSE1=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"안녕하세요\",
    \"botId\": \"$BOT_ID\",
    \"conversationHistory\": [],
    \"userId\": \"student-log-test-$(date +%s)\",
    \"userRole\": \"STUDENT\",
    \"userAcademyId\": \"academy-test-001\"
  }")

echo "$RESPONSE1" | jq '{
  success,
  requestId,
  duration,
  workerRAGUsed,
  ragContextCount,
  hasResponse: (.response != null),
  responseLength: (.response | length),
  error,
  errorType
}' 2>/dev/null || echo "$RESPONSE1"

echo ""
echo "---"
echo ""

# Test 2: 학생 계정 - 대화 히스토리 포함
echo "📝 Test 2: 학생 계정 - 대화 히스토리 포함"
RESPONSE2=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"당신은 누구인가요?\",
    \"botId\": \"$BOT_ID\",
    \"conversationHistory\": [
      {\"role\": \"user\", \"content\": \"안녕하세요\"},
      {\"role\": \"assistant\", \"content\": \"안녕하세요! 저는 꾸메땅학원의 중등부 전용 단어 암기 스피드 체커입니다.\"}
    ],
    \"userId\": \"student-log-test-$(date +%s)\",
    \"userRole\": \"STUDENT\",
    \"userAcademyId\": \"academy-test-001\"
  }")

echo "$RESPONSE2" | jq '{
  success,
  requestId,
  duration,
  workerRAGUsed,
  ragContextCount,
  hasResponse: (.response != null),
  responseLength: (.response | length),
  error,
  errorType
}' 2>/dev/null || echo "$RESPONSE2"

echo ""
echo "---"
echo ""

# Test 3: 학원장 계정 - 긴 대화 히스토리
echo "📝 Test 3: 학원장 계정 - 긴 대화 히스토리"
RESPONSE3=$(curl -s -X POST https://suplacestudy.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"다섯 번째 메시지\",
    \"botId\": \"$BOT_ID\",
    \"conversationHistory\": [
      {\"role\": \"user\", \"content\": \"첫 번째\"},
      {\"role\": \"assistant\", \"content\": \"첫 답변\"},
      {\"role\": \"user\", \"content\": \"두 번째\"},
      {\"role\": \"assistant\", \"content\": \"두 답변\"},
      {\"role\": \"user\", \"content\": \"세 번째\"},
      {\"role\": \"assistant\", \"content\": \"세 답변\"},
      {\"role\": \"user\", \"content\": \"네 번째\"},
      {\"role\": \"assistant\", \"content\": \"네 답변\"}
    ],
    \"userId\": \"owner-log-test-$(date +%s)\",
    \"userRole\": \"OWNER\",
    \"userAcademyId\": \"academy-test-001\"
  }")

echo "$RESPONSE3" | jq '{
  success,
  requestId,
  duration,
  workerRAGUsed,
  ragContextCount,
  hasResponse: (.response != null),
  responseLength: (.response | length),
  error,
  errorType
}' 2>/dev/null || echo "$RESPONSE3"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 테스트 완료"
echo ""
echo "이제 Cloudflare Pages 로그에서 다음을 확인할 수 있습니다:"
echo "- [requestId] 로 시작하는 모든 로그"
echo "- 요청 시작/완료 시간"
echo "- 상세한 에러 정보"
echo ""
echo "로그 확인 방법:"
echo "1. https://dash.cloudflare.com/"
echo "2. Pages > superplacestudy"
echo "3. Deployments > Latest > View Logs"
echo "4. 또는 로컬에서: npx wrangler pages deployment tail --project-name=superplacestudy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
